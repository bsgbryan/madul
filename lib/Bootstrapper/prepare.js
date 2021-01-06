const { wrap    } = require('../MethodWrapper')
const   hydrate   = require('../DependencyHydrator')

const executeInitializers = require('./executeInitializers')

const prepare = async (spec, madul, cb) => {
  const hydrated =
    madul.hasOwnProperty('deps') ?
      await hydrate(madul.deps)
      :
      { }

  const wrapped = await wrap(spec, { ...madul, ...hydrated })
  const ready   = Object.freeze(wrapped)

  await executeInitializers(ready)

  cb(ready)
}

module.exports = prepare