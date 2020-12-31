const { each } = require('async')

const execute$ = async ready => {
  const $ = Object.keys(ready).filter(r => r[0] === '$')

  return await each($, async i => await ready[i]())
}

module.exports = execute$