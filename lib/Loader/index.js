const { SCOPE } = require('../DependencySpec')

const { fromNodeModules } = require('../SourceLocator')

const iterable = require('../../sdk/Iterable')
const events   = require('../../sdk/Events')
const tmpFile  = require('./tmpFile')

const load = async (ref, scope) =>
  new Promise(async (resolve, reject) => {
    try {
      scope === SCOPE.DEFAULT ?
        resolve(require(await fromNodeModules(ref)))
        :
        resolve(require(await tmpFile(ref))({ iterable, events }))
    } catch (e) {
      reject(e)
    }
  })

module.exports = load