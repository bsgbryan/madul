import { Config, Madul, MadulDictionary } from "../types"

import { log } from "../../sdk/Events"

import { executeAndReset } from "../helpers"

import { processAllBundles } from "../BundleProcessor"

import {
  add,
  init,
} from "../CollectionManager"

import {
  SCOPE,
  parse,
} from "../DependencySpec"

import load from "../Loader"

import prepare from "./prepare"

const available: MadulDictionary = { }

const defaultConfig: Config = {
  sdk:  undefined,
  root: process.cwd(),
}

const Bootstrap = async (
  spec: string,
  params = {},
  config = defaultConfig,
): Promise<Madul> =>
  new Promise(async (resolve, reject) => {
    const { ref, scope } = parse(spec)

    const cb = () => resolve(available[ref] as Madul)
      
    log('madul.requested', { spec })

    switch (available[ref]) {
      case undefined:
        log('madul.bootstrap', { spec })
      
        available[ref] = null

        init(`${ref}::LISTENERS`)
        add(`${ref}::LISTENERS`, cb)

        await processAllBundles(spec)

        let loaded

        try { loaded = await load(spec, config) }
        // @ts-ignore
        catch (e) { return reject(`Error loading ${spec}: ${e.message}`) }

        switch(scope) {
          case SCOPE.DEFAULT:
            available[ref] = loaded

            return executeAndReset(`${ref}::LISTENERS`, cb.name)
          case SCOPE.INTERNAL:
            available[ref] = loaded

            return executeAndReset(ref, cb.name)
          default:
            try {
              prepare(spec, params, loaded, config.root, (ready: Madul) => {
                available[ref] = ready

                executeAndReset(`${ref}::LISTENERS`, cb.name)
              })
            }
            catch (e) { reject(e) }
        }

        break
      case null:
        add(`${ref}::LISTENERS`, cb)
        break
      default:
        cb()
    }
  })

export default Bootstrap
