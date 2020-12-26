const { Fire } = require('./Event')

const load = require('./Loader')

const { parse            } = require('./DependencySpec')
const { wrap             } = require('./MethodWrapper')
const { hydrate          } = require('./DependencyHydrator')
const { executeAndDelete } = require('./helpers')

const available = { }
const listeners = { }

// class Madul {
//   on   (event, handler) { Listen(event, handler) }
//   log  (event, params ) { Fire  (event, params ) }
//   warn (event, params ) { Fire  (event, params ) }
//   error(event, params ) { Fire  (event, params ) }
// }

const doInitialize = async (madul, cb) => {
  Fire(`$.${madul.name}.initialize`)

  available[madul.name] = null
  listeners[madul.name] = [cb]

  const hydrated = await hydrate(madul)
  const wrapped  = await wrap(madul)

  available[madul.name] = Object.freeze({ ...wrapped, ...hydrated })

  executeAndDelete(listeners, madul.name)
}

const initialize = spec =>
  new Promise(async (resolve, reject) => {
    const { ref, scope } = parse(spec)
    const cb = () => resolve(available[ref])
      
    Fire(`$.${ref}.requested`)

    switch (available[ref]) {
      case undefined:
        const loaded = await load(ref, scope)

        try { doInitialize(loaded, cb) }
        catch (e) { reject(e) }
        break
      case null:
        listeners[ref].push(cb)
        break
      default:
        process.nextTick(cb)
    }
  })

module.exports = initialize

exports.doInitialize = doInitialize
