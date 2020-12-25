const { each } = require('async')

const initialize = require('./Madul')

const { parse            } = require('./DependencySpec')
const { executeAndDelete } = require('./helpers')

const completed = { }
const listeners = { }

const doHydrate = async (deps) => {
  return new Promise((resolve, reject) => {
    const output = { }

    each(deps, async (d, next) => {
      const { ref } = parse(d)

      try { output[ref] = await initialize(d) }
      catch (e) { reject(e) }
      finally { next() }
    }, () => resolve(Object.freeze(output)))
  })
}

const hydrate = async (madul) => {
  const name = madul.name
  const cb   = () => resolve(completed[name])

  return new Promise(async (resolve, reject) => {
    if (madul.hasOwnProperty('deps')) {  
      switch(completed[name]) {
        case undefined:
          completed[name] = null
          listeners[name] = [cb]
  
          try {
            completed[name] = await doHydrate(madul.deps)
  
            executeAndDelete(listeners[name])
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
      resolve()
  })
}

exports.hydrate   = hydrate
exports.doHydrate = doHydrate