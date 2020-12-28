const { each } = require('async')

const { log } = require('../sdk/Events')

const load = require('./Loader')

const {
  SCOPE,
  parse,
} = require('./DependencySpec')

const { wrap             } = require('./MethodWrapper')
const { hydrate          } = require('./DependencyHydrator')
const { executeAndDelete } = require('./helpers')

const available = { }
const listeners = { }

const execute$ = async ready => {
  const $ = Object.keys(ready).filter(r => r[0] === '$')

  return each($, async i => ready[i]())
}

const prepare = async (name, madul) => {
  const hydrated = await hydrate(name, madul)
  const wrapped  = await wrap(madul)
  const ready    = Object.freeze({ ...wrapped, ...hydrated })

  await execute$(ready)

  available[name] = ready

  executeAndDelete(listeners, name)
}

const initialize = async spec =>
  new Promise(async (resolve, reject) => {
    const { ref, scope } = parse(spec)

    const cb = () => resolve(available[ref])
      
    log('madul.requested', { ref, scope })

    switch (available[ref]) {
      case undefined:
        log('madul.initialize', { spec })
      
        available[ref] = null
        listeners[ref] = [cb]

        const loaded = await load(ref, scope)

        switch(scope) {
          case SCOPE.DEFAULT:
            available[ref] = loaded

            return executeAndDelete(listeners, ref)
          default:
            try { prepare(ref, loaded) }
            catch (e) { reject(e) }
        }

        break
      case null:
        listeners[ref].push(cb)
        break
      default:
        process.nextTick(cb)
    }
  })

module.exports = initialize

module.exports.prepare  = prepare
module.exports.execute$ = execute$
