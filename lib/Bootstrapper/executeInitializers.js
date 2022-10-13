const { each } = require('async')

const executeInitializers = async (ready, params) =>
  new Promise(async (resolve, reject) => {
    const $ = Object.keys(ready).filter(r => r[0] === '$')

    try {
      const extra = {}

      await each($, async i => {
        const e = await ready[i](params)

        for (const k of Object.keys(e || { }))
          extra[k] = e[k]
      })

      resolve(extra)
    }
    catch (e) { reject(e) }
  })

module.exports = executeInitializers