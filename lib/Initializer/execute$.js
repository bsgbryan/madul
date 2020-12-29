const { each } = require('async')

const execute$ = async ready => {
  const $ = Object.keys(ready).filter(r => r[0] === '$')

  return each($, async i => ready[i]())
}

module.exports = execute$