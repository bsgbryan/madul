const { each } = require('async')

const { emit } = require('../sdk/Events')

const { parse } = require('./DependencySpec')

const doWrap = (name, instance, property, output) =>
  async params =>
    new Promise((resolve, reject) => {
      const progress = params => emit.progress(name, property, params)
      const done     = params => {
        emit.done(name, property, params)
        resolve(params)
      }

      try {
        emit.call(name, property, params)
        instance[property].call(output, { ...params, done, progress })
      }
      catch (e) {
        emit.error(name, property, e)
        reject(e)
      }
    })

const validate = instance => {
  if (Array.isArray(instance))
    throw new Error('An array cannot be wrapped')

  if (instance === false)
    throw new Error(`boolean is not a valid type`)

  if (instance === null)
    throw new Error('Cannot wrap null')

  if (instance === undefined)
    throw new Error('Cannot wrap undefined')

  if (typeof instance !== 'object' && typeof instance !== 'function')
    throw new Error(`${typeof instance} is not a valid type`)

  const fns = Object.keys(instance).filter(i => typeof instance[i] === 'function')

  if (typeof instance === 'object' && fns.length === 0)
    throw new Error('instance must contain at least one functional property')
}

const wrap = async (name, instance) => {
  validate(instance)

  const deps = instance.deps?.map(spec => parse(spec).ref)

  return new Promise(resolve => {
    const output = { }

    each(Object.keys(instance), (property, next) => {
      const isntDep = !deps?.includes(property)
      const isFn    = typeof instance[property] === 'function'

      output[property] =
        isFn && isntDep ?
          doWrap(name, instance, property, output)
          :
          instance[property]

      next()
    }, () => resolve(Object.freeze(output)))
  })
}

exports.wrap     = wrap
exports.doWrap   = doWrap
exports.validate = validate