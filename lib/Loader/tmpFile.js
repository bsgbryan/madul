const {
  mkdir,
  readFile,
  writeFile,
} = require('fs').promises

const { tmpdir } = require('os')

const { fromCWD } = require('../SourceLocator')

const wrap = source => `
module.exports = sdk => {
${source}

return exports || module.exports

}
`

const createTmpFile = async ref => {
  const location = await fromCWD(ref)
  const source   = await readFile(location, 'utf8')
  const wrapped  = wrap(source)

  const path = location.
    split('/').
    filter(l => l.endsWith('.js') === false).
    join('/').
    substr(process.cwd().length)

  const loadPath = `${tmpdir()}/madul${path}`
  const loadFile = `${loadPath}/${ref}.js`

  await mkdir(loadPath, { recursive: true })
  await writeFile(loadFile, wrapped)

  return loadFile
}

createTmpFile.wrap = wrap

module.exports = createTmpFile