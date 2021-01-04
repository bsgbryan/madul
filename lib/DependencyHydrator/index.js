const { each } = require('async')
const { cpuCurrentspeed } = require('systeminformation')

const { parse           } = require('../DependencySpec')
const { executeAndReset } = require('../helpers')

const listeners = require('./listeners')

const {
  add,
  get,
  init,
} = listeners

const completed = { }

const doHydrate = async (deps) => {
  return new Promise(async (resolve, reject) => {
    const output = { }

    await each(deps, async d => {
      const { ref, functions } = parse(d)

      try {
        const initialized = await require('../Initializer')(d)

        if (functions.length > 0)
          functions.forEach(f => output[f] = initialized[f])
        else
          output[ref] = initialized
      }
      catch (e) { reject(e) }
    })

    resolve(Object.freeze(output))
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

          init(name)
          add(name, cb)
  
          try {
            completed[name] = await doHydrate(madul.deps)
  
            executeAndReset(listeners, name)
          }
          catch (e) { reject(e) }
  
          break
        default:
          cb()
      }
    } else
      cb()
  })
}

exports.hydrate   = hydrate
exports.doHydrate = doHydrate