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

const fromNodeModules = async (ref, root) => {
  const path = `${root}/node_modules/${ref}`
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
  const mapped = search.map(s => `${path}/${s}`)

  return mapped.sort()
}

const walk = async (root, ref) => {
  const match = await find(root, ref)

  if (match === undefined) {
    const dirs     = await recurse(root)
    const found    = await map(dirs, async d => await find(d, ref))
    const filtered = found.filter(f => f !== undefined)

    if (filtered.length === 1)
      return filtered[0]
    else {
      const f = await filter(dirs, async d => await walk(d, ref))

      if (f.length === 1)
        return f[0]
    }
  } else
    return match
}

const fromCWD = async (ref, root) =>
  new Promise(async (resolve, reject) => {
    try {
      const found = await walk(root, ref)

      found ? resolve(found) : reject({ message: `${ref} not found` })
    }
    catch (e) { reject(e) }
  })

exports.find    = find
exports.recurse = recurse

exports.fromCWD         = fromCWD
exports.fromNodeModules = fromNodeModules