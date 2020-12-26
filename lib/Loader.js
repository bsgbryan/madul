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

const wrap = source => `
module.exports = ({log}) => {
let madul, decorator

${source}

return { madul, decorator }

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
      if (scope === SCOPE.LOCAL) {
        const location = await tmp(ref)

        resolve(require(location)({ log: () => {} }))
      } else {
        const location = await fromNodeModules(ref)

        resolve(require(location))
      }
    } catch (e) {
      reject(e)
    }
  })

module.exports = load