const { each } = require('async')

const executeInitializers = async ready => {
  const $ = Object.keys(ready).filter(r => r[0] === '$')

  return await each($, async i => await ready[i]())
}

module.exports = executeInitializers