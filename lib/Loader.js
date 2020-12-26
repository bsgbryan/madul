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

const load = async (ref, scope) =>
  new Promise(async (resolve, reject) => {
    const location = scope === SCOPE.LOCAL ?
      await fromCWD(ref)
      :
      await fromNodeModules(ref)

    const source   = await readFile(location, 'utf8')
    const wrapped  = wrap(source)

    const path = location.
      split('/').
      filter(l => l.endsWith('.js') === false).
      join('/').
      substr(process.cwd().length)

    const loadPath = `${tmpdir()}/madul/${path}`
    const loadFile = `${loadPath}/${ref}.js`
    
    try {
      await mkdir(loadPath, { recursive: true })
      await writeFile(loadFile, wrapped)
  
      resolve(require(loadFile)({ log: () => {} }))
    } catch (e) {
      reject(e)
    }
  })

module.exports = load