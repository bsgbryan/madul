import { readdir } from "node:fs/promises"

import { each } from "async"

import {
  add,
  init,
} from "./CollectionManager"

import { assign } from "./SDKMapping"

import { log } from "../sdk/Events"

export const processAllBundles = async (spec: string) => {
  const root = `${process.cwd()}/.madul`

  init(spec)

  try { await each(await readdir(root), async node => await processBundle(spec, node)) }
  catch (e) {
    // @ts-ignore
    if (e.code === 'ENOENT')
      log('No madul config directory found')
  }
}

export const processBundle = async (
  spec: string,
  file: string,
) => {
  const path   = `${process.cwd()}/.madul/${file}`
  const bundle = require(path)

  init(`${spec}::DECORATORS`)

  if (bundle?.maduls?.includes(spec)) {
    if (Array.isArray(bundle.decorators))
      await each(bundle.decorators, async (d: string) => await add(`${spec}::DECORATORS`, d))

    if(typeof bundle.sdk === 'object')
      assign(spec, { ...bundle.sdk })
  }
}
