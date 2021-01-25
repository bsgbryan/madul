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

    try {
      scope === SCOPE.DEFAULT ?
        resolve(require(ref))
        :
        resolve(require(await tmpFile(ref, config.root))({ ...config.sdk, ...get(spec) }))
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        try { resolve(require(await fromNodeModules(ref, config.root))) }
        catch (e) { reject(e) }
      }
    }
  })

module.exports = load