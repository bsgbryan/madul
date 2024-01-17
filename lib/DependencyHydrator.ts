import { each } from "async"

import { MadulDictionary } from "./types"

const DependencyHydrator = async (
  deps: Array<string>,
  bootstrap: CallableFunction,
  params = {},
  root = process.cwd(),
): Promise<MadulDictionary> => {
  return new Promise(async (resolve, reject) => {
    const output: MadulDictionary = { }

    await each(deps, async d => {
      try { output[d] = await bootstrap(d, params, { root }) }
      catch (e) { reject(e) }
    })

    resolve(output)
  })
}

export default DependencyHydrator