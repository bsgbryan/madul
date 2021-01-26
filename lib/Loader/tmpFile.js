const {
  stat,
  mkdir,
  readFile,
  writeFile,
} = require('fs').promises

const { tmpdir   } = require('os')
const { isWorker } = require('cluster')

const { fromCWD } = require('../SourceLocator')

const wrap = (source, location) => `
module.exports = sdk => {

${source.
  replace("require('.", `require('${location}/.`).
  replace('require(".', `require("${location}/.`)
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

const createTmpFile = async (ref, root) => {
  const location = await fromCWD(ref, root)
  const source   = await readFile(location, 'utf8')

  const localRoot = location.
  split('/').
  filter(l => l.endsWith('.js') === false).
  join('/').
  substr(root.length)

  const fullPath = location.
    split('/').
    filter(l => l.endsWith('.js') === false).
    join('/')

  const wrapped = wrap(source, fullPath)

  const loadPath = `${tmpdir()}/madul${localRoot}`
  const loadFile = `${loadPath}/${ref}.js`

  if (isWorker)
    await createTmpFileOnlyIfItDoesntExist(loadFile, loadPath, wrapped)
  else {
    await mkdir(loadPath, { recursive: true })
    await writeFile(loadFile, wrapped)
  }

  return loadFile
}

createTmpFile.wrap                             = wrap
createTmpFile.createTmpFileOnlyIfItDoesntExist = createTmpFileOnlyIfItDoesntExist

module.exports = createTmpFile