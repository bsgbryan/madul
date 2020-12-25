const { each } = require('async')

const { parse } = require('./DependencySpec')

const doWrap = (instance, property, output) =>
  async params =>
    new Promise((resolve, reject) => {
      const args = { ...params, done: resolve, fail: reject }
      try { instance[property].call(output, args) }
      catch (e) { reject(e) }
    })

const validate = instance => {
  if (typeof instance !== 'object' && typeof instance !== 'function')
    throw new Error(`${typeof instance} is not a valid type`)

  const fns = Object.keys(instance).filter(i => typeof instance[i] === 'function')

  if (typeof instance === 'object' && fns.length === 0)
    throw new Error('To be wrapped, an instance must contain at least one function')
}

const wrap = instance => {
  validate(instance)

  const deps = instance.deps?.map(spec => parse(spec).ref)

  return new Promise(resolve => {
    const output = { }

    each(Object.keys(instance), (property, next) => {
      const isntDep = !deps?.includes(property)
      const isFn    = typeof instance[property] === 'function'

      output[property] =
        isFn && isntDep ?
          doWrap(instance, property, output)
          :
          instance[property]

      next()
    }, () => resolve(Object.freeze(output)))
  })
}

exports.wrap     = wrap
exports.doWrap   = doWrap
exports.validate = validate