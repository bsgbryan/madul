const {
  stat,
  mkdir,
  readFile,
  writeFile,
} = require('fs').promises

const { writeFileSync } = require('fs')

const { isPrimary } = require('cluster')

const { fromCWD } = require('../SourceLocator')

const wrap = (source, location) => `
module.exports = sdk => {

${source.
  replaceAll("require('.", `require('${location}/.`).
  replaceAll('require(".', `require("${location}/.`)
}

return madul

}
`

const createTmpFileOnlyIfItDoesntExist = async (
  loadFile,
  loadPath,
  wrapped
) => {
  try { await stat(loadFile) }
  catch (e) {
    if (e.code === 'ENOENT') {
      await mkdir(loadPath, { recursive: true })
      await writeFile(loadFile, wrapped)
    }
  }
}

const createTmpFile = (ref, root) =>
  new Promise(async (resolve, _) => {
    const location = await fromCWD(ref, root)

    const localRoot = location.
      split('/').
      filter(l => l.endsWith('.js') === false).
      join('/').
      substr(root.length)

    const loadPath = `${process.cwd()}/.maduls${localRoot}`
    const loadFile = `${loadPath}/${ref}.js`

    const source   = await readFile(location, 'utf8')
    const fullPath = location.
      split('/').
      filter(l => l.endsWith('.js') === false).
      join('/')

    const wrapped = wrap(source, fullPath)

    if (isPrimary) {
      try { await stat(loadFile) }
      catch (e) {
        if (e.code === 'ENOENT') {
          await mkdir(loadPath, { recursive: true })
          await writeFile(loadFile, wrapped)
        }
      }
      finally { resolve(loadFile) }
    }
    else {
      try { await stat(loadFile) }
      catch (e) {
        if (e.code === 'ENOENT') {
          try {
            await mkdir(loadPath, { recursive: true })
            writeFileSync(loadFile, wrapped, { flag: 'wx' })
          }
          catch (e) {
            // if (e.code === 'EEXIST')
            //   console.info(loadFile, 'already created')
          }
        }
      }
      finally { resolve(loadFile) }
    }
  })

createTmpFile.wrap                             = wrap
createTmpFile.createTmpFileOnlyIfItDoesntExist = createTmpFileOnlyIfItDoesntExist

module.exports = createTmpFile