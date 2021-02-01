const { each } = require('async')

const executeInitializers = async (ready, params) =>
  new Promise(async (resolve, reject) => {
    const $ = Object.keys(ready).filter(r => r[0] === '$')

    try { resolve(await each($, async i => await ready[i](params))) }
    catch (e) { reject(e) }
  })

module.exports = executeInitializers