

const { executeAndDelete } = require('../helpers')

const { wrap    } = require('../MethodWrapper')
const { hydrate } = require('../DependencyHydrator')

const execute$ = require('./execute$')

const prepare = async (name, madul) => {
  const hydrated = await hydrate(name, madul)
  const wrapped  = await wrap(name, madul)
  const ready    = Object.freeze({ ...wrapped, ...hydrated })

  await execute$(ready)

  available[name] = ready

  executeAndDelete(listeners, name)
}

module.exports = prepare