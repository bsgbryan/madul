const {
  SCOPE,
  parse,
} = require('../DependencySpec')

const { fromNodeModules } = require('../SourceLocator')
const { get             } = require('../SDKMapping')

const tmpFile = require('./tmpFile')

const load = async (spec, config) =>
  new Promise(async (resolve, reject) => {
    const { ref, scope } = parse(spec)

    if (scope === SCOPE.DEFAULT) {
      try { resolve(require(ref)) }
      catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          try { resolve(require(await fromNodeModules(ref, config.root))) }
          catch (e) { reject(e) }
        }
      }
    }
    else {
      try {
        const sdk = { ...get(spec), ...config.sdk }
        const tmp = await tmpFile(ref, config.root)

        resolve(require(tmp)(sdk))
      }
      catch (e) { reject(e) }
    }
  })

module.exports = load