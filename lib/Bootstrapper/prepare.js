const { wrap    } = require('../MethodWrapper')
const   hydrate   = require('../DependencyHydrator')

const prepare = async (spec, params, madul, root, cb) => {
  const hydrated =
    madul.hasOwnProperty('deps') ?
      await hydrate(madul.deps, params, root)
      :
      { }

  const wrapped = await wrap(spec, { ...madul, hydrated }, params)

  cb(Object.freeze(wrapped))
}

module.exports = prepare