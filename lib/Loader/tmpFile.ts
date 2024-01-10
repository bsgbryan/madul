import {
  stat,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises"

import { writeFileSync } from "fs"

import cluster from "cluster"

import { fromCWD } from "../SourceLocator"

export const wrap = (
  source:   string,
  location = '',
) => `
module.exports = sdk => {

${source.
  replaceAll("require('.", `require('${location}/.`).
  replaceAll('require(".', `require("${location}/.`)
}

return madul

}
`

export const createTmpFileOnlyIfItDoesntExist = async (
  loadFile: string,
  loadPath: string,
  wrapped:  string,
) => {
  try { await stat(loadFile) }
  catch (e) {
    // @ts-ignore
    if (e.code === 'ENOENT') {
      await mkdir(loadPath, { recursive: true })
      await writeFile(loadFile, wrapped)
    }
  }
}

const createTmpFile = (
  ref: string,
  root: string,
): Promise<string> =>
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

    if (cluster.isPrimary) {
      try { await stat(loadFile) }
      catch (e) {
        // @ts-ignore
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
        // @ts-ignore
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

export default createTmpFile