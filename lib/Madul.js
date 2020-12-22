
const {
  Fire,
  Listen
} = require('./Event')

const { wrap             } = require('./MethodWrapper')
const { hydrate          } = require('./DependencyHydrator')
const { executeAndDelete } = require('./helpers')

const available = { }
const listeners = { }

class Madul {
  on   (event, handler) { Listen(event, handler) }
  log  (event, params ) { Fire  (event, params ) }
  warn (event, params ) { Fire  (event, params ) }
  error(event, params ) { Fire  (event, params ) }
}

const doInitialize = async (madul, name, cb) => {
  Fire(`$.${name}.initialize`)

  available[name] = null
  listeners[name] = [cb]

  const instance = new madul()
  const hydrated = await hydrate(instance.deps)
  const wrapped  = await wrap(instance)

  available[name] = Object.freeze({ ...wrapped, ...hydrated })

  executeAndDelete(listeners[name])
}

const initialize = async ({ madul, decorator }) => {
  return new Promise((resolve, reject) => {
    const name = madul.name
    const cb   = () => resolve(available[name])
      
    Fire(`$.${name}.requested`)

    switch (available[name]) {
      case undefined:
        try { doInitialize(madul, name, cb) }
        catch (e) { reject(e) }
        break
      case null:
        listeners[name].push(cb)
        break
      default:
        process.nextTick(cb)
    }
  })
}

exports.Madul      = Madul
exports.initialize = initialize
