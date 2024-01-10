import {
  stat,
  readdir,
  readFile,
} from "node:fs/promises"

import {
  map,
  each,
  filter,
  reject,
} from "async"

const ignore = [
  'test',
  'node_modules',
]

export const fromNodeModules = async (ref: string, root: string) => {
  const path = `${root}/node_modules/${ref}`
  const pkg  = `${path}/package.json`

  try {
    if ((await stat(pkg)).isFile()) {
      const data = await readFile(pkg, 'utf8')
      const json = JSON.parse(data)
      const main = json.main || json._main || 'index.js'
  
      return `${path}/${main}`
    }
  }
  catch (e) { return undefined }
}

export const find = async (path: string, ref: string) => {
  const nodes = await readdir(path)
  const files = await filter(nodes, async (file) => {
    const s = await stat(`${path}/${file}`)

    return s.isFile()
  })

  const match = await filter(files, async f => f === `${ref}.js`)

  return match.length === 1 ? `${path}/${match[0]}` : undefined
}

export const recurse = async (path: string) => {
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

// TODO Add tests for this
export const walk = async (root: string, ref: string, cb: CallableFunction) => {
  const match = await find(root, ref)

  if (match === undefined) {
    const dirs     = await recurse(root)
    const found    = await map(dirs, async (d: string) => await find(d, ref))
    const filtered = found.filter(f => f !== undefined)

    if (filtered.length === 1)
      cb(filtered[0])
    else if (dirs.length > 0) {
      let m = 'not found'

      const callback = (result: string) => m = result ? result : m

      await each(dirs, async d => await walk(d, ref, callback))

      cb(m === 'not found' ? false : m)
    }
  } else
    cb(match)
}

export const fromCWD = async (
  ref:  string,
  root: string,
): Promise<string> =>
  new Promise(async (resolve, reject) => {
    try {
      await walk(root, ref, (found: string) =>
        found ? resolve(found) : reject({ message: `${ref} not found` })
      )
    }
    catch (e) { reject(e) }
  })
