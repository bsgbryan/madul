const {
  mkdir,
  readFile,
  writeFile,
} = require('fs').promises

const { tmpdir } = require('os')

const { SCOPE } = require('./DependencySpec')

const {
  fromCWD,
  fromNodeModules
} = require('./SourceLocator')

const iterable = require('../sdk/Iterable')
const events   = require('../sdk/Events')

const wrap = source => `
module.exports = sdk => {
${source}

return exports || module.exports

}
`

const tmp = async ref => {
  const location = await fromCWD(ref)
  const source   = await readFile(location, 'utf8')
  const wrapped  = wrap(source)

  const path = location.
    split('/').
    filter(l => l.endsWith('.js') === false).
    join('/').
    substr(process.cwd().length)

  const loadPath = `${tmpdir()}/madul/${path}`
  const loadFile = `${loadPath}/${ref}.js`

  await mkdir(loadPath, { recursive: true })
  await writeFile(loadFile, wrapped)

  return loadFile
}

const load = async (ref, scope) =>
  new Promise(async (resolve, reject) => {
    try {
      scope === SCOPE.DEFAULT ?
        resolve(require(await fromNodeModules(ref)))
        :
        resolve(require(await tmp(ref))({ iterable, events }))
    } catch (e) {
      reject(e)
    }
  })

module.exports = load