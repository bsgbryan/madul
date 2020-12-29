const { log } = require('../../sdk/Events')

const load = require('../Loader')

const { executeAndDelete } = require('../helpers')

const {
  SCOPE,
  parse,
} = require('../DependencySpec')

const prepare = require('./prepare')

const available = { }
const listeners = { }

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
            try {
              prepare(ref, loaded, ready => {
                available[ref] = ready

                executeAndDelete(listeners, ref)
              })
            }
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
