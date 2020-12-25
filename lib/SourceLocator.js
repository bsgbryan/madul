const {
  stat,
  readdir,
  readFile,
} = require('fs').promises

const {
  map,
  each,
  filter,
  reject,
} = require('async')

const ignore = [
  'test',
  'node_modules',
]

const fromNodeModules = async ref => {
  const path = `${process.cwd()}/node_modules/${ref}`
  const pkg  = `${path}/package.json`
  const s    = await stat(pkg)

  if (s.isFile()) {
    const data = await readFile(pkg, 'utf8')
    const json = JSON.parse(data)
    const main = json.main || json._main || 'index.js'

    return `${path}/${main}`
  }
}

const find = async (path, ref) => {
  const nodes = await readdir(path)
  const files = await filter(nodes, async (file) => {
    const s = await stat(`${path}/${file}`)

    return s.isFile()
  })

  const match = await filter(files, async f => f === `${ref}.js`)

  return match.length === 1 ? `${path}/${match[0]}` : undefined
}

const recurse = async path => {
  const files = await readdir(path)
  const dirs  = await filter(files, async (file) => {
    const s = await stat(`${path}/${file}`)

    return s.isDirectory()
  })

  const noDot  = await reject(dirs,  async file => file.startsWith('.'))
  const search = await reject(noDot, async file => ignore.includes(file))
  const mapped = await map(search, async s => `${path}/${s}`)

  return mapped.sort()
}

const walk = async (root, ref, done) => {
  const match = await find(root, ref)

  if (match === undefined) {
    const dirs     = await recurse(root)
    const found    = await map(dirs, async d => await find(d, ref))
    const filtered = await filter(found, async f => f !== undefined)

    if (filtered.length === 1)
      done(filtered[0])
    else
      each(dirs, d => walk(d, ref, done))
  } else
    done(match)
}

const fromCWD = async ref =>
  new Promise(resolve => walk(process.cwd(), ref, resolve))

exports.find    = find
exports.recurse = recurse

exports.fromCWD         = fromCWD
exports.fromNodeModules = fromNodeModules