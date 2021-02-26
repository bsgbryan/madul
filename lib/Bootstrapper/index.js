const { log } = require('../../sdk/Events')

const load = require('../Loader')

const { executeAndReset } = require('../helpers')

const {
  SCOPE,
  parse,
} = require('../DependencySpec')

const { processAllBundles } = require('../BundleProcessor')

const prepare = require('./prepare')

const listeners = require('./listeners')

const {
  add,
  init,
} = listeners

const available = { }

const defaultConfig = {
  sdk:  undefined,
  root: process.cwd(),
}

const bootstrap = async (spec, params = {}, config = defaultConfig) =>
  new Promise(async (resolve, reject) => {
    const { ref, scope } = parse(spec)

    const cb = () => resolve(available[ref])
      
    log('madul.requested', { spec })

    switch (available[ref]) {
      case undefined:
        log('madul.bootstrap', { spec })
      
        available[ref] = null

        init(ref)
        add(ref, cb)

        await processAllBundles(spec)

        let loaded

        try { loaded = await load(spec, config) }
        catch (e) { return reject(`Error loading ${spec}: ${e.message}`) }

        switch(scope) {
          case SCOPE.DEFAULT:
            available[ref] = loaded

            return executeAndReset(listeners, ref)
          default:
            try {
              prepare(spec, params, loaded, config.root, ready => {
                available[ref] = ready

                executeAndReset(listeners, ref)
              })
            }
            catch (e) { reject(e) }
        }

        break
      case null:
        add(ref, cb)
        break
      default:
        cb()
    }
  })

module.exports = bootstrap
