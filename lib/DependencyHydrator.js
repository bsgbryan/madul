const { each } = require('async')

const { parse            } = require('./DependencySpec')
const { executeAndDelete } = require('./helpers')

const completed = { }
const listeners = { }

const doHydrate = async (deps) => {
  return new Promise((resolve, reject) => {
    const output = { }

    each(deps, async (d, next) => {
      const { ref, functions } = parse(d)

      try {
        const initialized = await require('./Initializer')(d)

        if (functions.length > 0)
          functions.forEach(f => output[f] = initialized[f])
        else
          output[ref] = initialized
      }
      catch (e) { reject(e) }
      finally { next() }
    }, () => resolve(Object.freeze(output)))
  })
}

const hydrate = async (spec, madul) => {
  const name = parse(spec).ref

  return new Promise(async (resolve, reject) => {
    const cb = () => resolve(completed[name])

    if (madul.hasOwnProperty('deps')) {
      switch(completed[name]) {
        case undefined:
          completed[name] = null
          listeners[name] = [cb]
  
          try {
            completed[name] = await doHydrate(madul.deps)
  
            executeAndDelete(listeners, name)
          } catch (e) {
            reject(e)
          }
  
          break
        case null:
          listeners[name].push(cb)
          break
        default:
          process.nextTick(cb)
      }
    } else
      resolve(madul)
  })
}

exports.hydrate   = hydrate
exports.doHydrate = doHydrate