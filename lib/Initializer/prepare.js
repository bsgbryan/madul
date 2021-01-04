const { wrap    } = require('../MethodWrapper')
const { hydrate } = require('../DependencyHydrator')

const execute$ = require('./execute$')

const prepare = async (spec, madul, cb) => {
  const hydrated = await hydrate(spec, madul)
  const wrapped  = await wrap(spec, { ...madul, ...hydrated })
  const ready    = Object.freeze(wrapped)

  await execute$(ready)
  cb(ready)
}

module.exports = prepare