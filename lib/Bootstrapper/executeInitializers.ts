import { each } from "async"

import { Madul, ParameterSet } from "../types"

const executeInitializers = async (
  ready:   Madul,
  params?: ParameterSet,
) =>
  new Promise(async (resolve, reject) => {
    const $ = Object.keys(ready).filter(r => r[0] === '$')

    try {
      const extra = { } as Madul

      await each($, async i => {
        const e = await ready[i](params)

        for (const k of Object.keys(e || { }))
          extra[k] = e[k]
      })

      resolve(extra)
    }
    catch (e) { reject(e) }
  })

export default executeInitializers