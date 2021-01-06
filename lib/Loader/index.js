const {
  SCOPE,
  parse,
} = require('../DependencySpec')

const { fromNodeModules } = require('../SourceLocator')
const { get             } = require('../SDKMapping')

const tmpFile = require('./tmpFile')

const load = async (spec, scope) =>
  new Promise(async (resolve, reject) => {
    const { ref } = parse(spec)

    try {
      scope === SCOPE.DEFAULT ?
        resolve(require(await fromNodeModules(ref)))
        :
        resolve(require(await tmpFile(ref))({ ...get(spec) }))
    } catch (e) {
      reject(e)
    }
  })

module.exports = load