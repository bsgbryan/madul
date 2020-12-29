const { wrap    } = require('../MethodWrapper')
const { hydrate } = require('../DependencyHydrator')

const execute$ = require('./execute$')

const prepare = async (name, madul, cb) => {
  const hydrated = await hydrate(name, madul)
  const wrapped  = await wrap(name, { ...madul, ...hydrated })
  const ready    = Object.freeze(wrapped)

  await execute$(ready)

  cb(ready)
}

module.exports = prepare