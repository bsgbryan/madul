const { each } = require('async')

const { parse } = require('./DependencySpec')

const doWrap = (instance, property, output) =>
  async params =>
    new Promise((resolve, reject) => {
      const args = { ...params, done: resolve, fail: reject }
      try { instance[property].call(output, args) }
      catch (e) { reject(e) }
    })

const wrap = async instance => {
  const deps = instance.deps?.map(spec => parse(spec).ref)

  return new Promise(resolve => {
    const output = { }

    each(Object.keys(instance), (property, next) => {
      const isDep = deps?.includes(property)

      if (typeof instance[property] === 'function' && isDep !== true)
        output[property] = doWrap(instance, property, output)
      else
        output[property] = instance[property]

      next()
    }, () => resolve(Object.freeze(output)))
  })
}

exports.wrap   = wrap
exports.doWrap = doWrap