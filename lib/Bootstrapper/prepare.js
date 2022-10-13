const { wrap    } = require('../MethodWrapper')
const   hydrate   = require('../DependencyHydrator')

const executeInitializers = require('./executeInitializers')

const prepare = async (spec, params, madul, root, cb) => {
  const hydrated =
    madul.hasOwnProperty('deps') ?
      await hydrate(madul.deps, params, root)
      :
      { }

  const wrapped = await wrap(spec, { ...madul, hydrated })
  const extra   = await executeInitializers(wrapped, params)

  cb(Object.freeze({ ...wrapped, ...extra }))
}

module.exports = prepare