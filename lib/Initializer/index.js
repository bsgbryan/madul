const { log } = require('../../sdk/Events')

const load = require('../Loader')

const { executeAndReset } = require('../helpers')

const {
  SCOPE,
  parse,
} = require('../DependencySpec')

const prepare = require('./prepare')

const listeners = require('../CollectionManager')('listener', { })
const available = { }

const initialize = async spec =>
  new Promise(async (resolve, reject) => {
    const { ref, scope } = parse(spec)

    const cb = () => resolve(available[ref])
      
    log('madul.requested', { spec })

    switch (available[ref]) {
      case undefined:
        log('madul.initialize', { spec })
      
        available[ref] = null

        listeners.init(ref)
        listeners.add(ref, cb)

        const loaded = await load(ref, scope)

        switch(scope) {
          case SCOPE.DEFAULT:
            available[ref] = loaded

            return executeAndReset(listeners, ref)
          default:
            try {
              prepare(spec, loaded, ready => {
                available[ref] = ready

                executeAndReset(listeners, ref)
              })
            }
            catch (e) { reject(e) }
        }

        break
      case null:
        listeners.add(ref, cb)
        break
      default:
        process.nextTick(cb)
    }
  })

module.exports = initialize
