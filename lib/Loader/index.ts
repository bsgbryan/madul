import {
  SCOPE,
  parse,
} from "../DependencySpec"

import { fromNodeModules } from "../SourceLocator"
import { get             } from "../SDKMapping"

import {
  Config,
  Madul,
} from "../types"

import tmpFile from "./tmpFile"

const Loader = async (
  spec:    string,
  config?: Config,
): Promise<Madul> =>
  new Promise(async (resolve, reject) => {
    const { handle, scope } = parse(spec)

    if (scope === SCOPE.DEFAULT) {
      try { resolve(require(handle)) }
      catch (e) {
        // @ts-ignore
        if (e.code === 'MODULE_NOT_FOUND') {
          const path = await fromNodeModules(handle, config?.root || '')

          if (path)
            try { resolve(require(path)) }
            catch (e) { reject(e) }
          else reject(new Error(`${handle} could not be found in ${config?.root}`))
        }
      }
    }
    else {
      try {
        const sdk = { ...get(spec), ...config?.sdk }
        const tmp = await tmpFile(handle, config?.root || '')

        resolve(require(tmp)(sdk))
      }
      catch (e) { reject(e) }
    }
  })

export default Loader