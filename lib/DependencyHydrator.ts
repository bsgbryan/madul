import { each } from "async"

import { parse } from "./DependencySpec"

import { MadulDictionary } from "./types"

const hydrate = async (
  deps: Array<string>,
  params = {},
  root = process.cwd(),
): Promise<MadulDictionary> => {
  return new Promise(async (resolve, reject) => {
    const output: MadulDictionary = { }

    await each(deps, async d => {
      const { ref, functions } = parse(d)

      try {
        const initialized = await require('./Bootstrapper')(d, params, { root })

        if (functions.length > 0)
          functions.forEach((f: string) => {
            const { ref, handle } = parse(f)

            output[ref] = initialized[handle]
          })
        else
          output[ref] = initialized
      }
      catch (e) { reject(e) }
    })

    resolve(output)
  })
}

export default hydrate