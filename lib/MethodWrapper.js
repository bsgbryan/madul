const {
  record,
  bootstrap,
} = require('../sdk/Invokation')

const { parse   } = require('./DependencySpec')
const { execute } = require('./DecoratorManager')

const doWrap = (spec, instance, method, context) =>
  async params =>
    new Promise(async (resolve, reject) => {
      const invokation = record()
      const progress   = params => invokation.update(spec, method, params)
      const done       = async result => {
        try {
          await execute({ mode: 'after', result, spec, method })
          invokation.complete(spec, method, result)
          resolve(result)
        }
        catch (e) {
          invokation.fail(spec, method, e)
          reject(e)
        }
      }

      try {
        await execute({ mode: 'before', params, spec, method })
        invokation.invoke(spec, method, params)
        instance[method].call(context, { ...params, done, progress })
      }
      catch (e) {
        invokation.fail(spec, method, e)
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

const wrap = async (spec, instance) =>
  new Promise(async (resolve, reject) => {
    try {
      validate(instance)

      await bootstrap()
    }
    catch (e) { return reject(e) }
    
    const deps   = instance.deps?.map(spec => parse(spec).ref)
    const output = { }

    Object.keys(instance).forEach(property => {
      const isntDep = !deps?.includes(property)
      const isFn    = typeof instance[property] === 'function'

      output[property] =
        isFn && isntDep ?
          doWrap(spec, instance, property, output)
          :
          instance[property]
    })

    resolve(Object.freeze(output))
  })

exports.wrap     = wrap
exports.doWrap   = doWrap
exports.validate = validate