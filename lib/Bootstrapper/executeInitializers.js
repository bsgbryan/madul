const { each } = require('async')

const executeInitializers = async (ready, params) => {
  const $ = Object.keys(ready).filter(r => r[0] === '$')

  await each($, async i => await ready[i](params))
}

module.exports = executeInitializers