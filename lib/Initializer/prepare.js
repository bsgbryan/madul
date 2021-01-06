const { wrap    } = require('../MethodWrapper')
const   hydrate   = require('../DependencyHydrator')

const execute$ = require('./execute$')

const prepare = async (spec, madul, cb) => {
  const hydrated =
    madul.hasOwnProperty('deps') ?
      await hydrate(madul.deps)
      :
      { }

  const wrapped = await wrap(spec, { ...madul, ...hydrated })
  const ready   = Object.freeze(wrapped)

  await execute$(ready)

  cb(ready)
}

module.exports = prepare