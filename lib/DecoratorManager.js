const { readdir } = require('fs').promises

const {
  each,
  some,
} = require('async')

const {
  get,
  add,
  init,
  reset,
  remove,
  getAll,
  addAll,
  resetAll,
} = require('./CollectionManager')('decorator', { })

const loadFromAllBundles = async spec => {
  const root = `${process.cwd()}/.madul`

  init(spec)

  try { await each(await readdir(root), async node => await loadFromBundle(spec, node)) }
  catch (e) { console.log('No bundle defined') }
}

const loadFromBundle = async (spec, bundle) => {
  const path = `${process.cwd()}/.madul/${bundle}`

  init(spec)

  try {
    const bundle = require(path)

    if (bundle.maduls.includes(spec))
      await each(bundle.decorators, async d => await add(spec, d))
  }
  catch (e) { throw new Error(`${path} does not exist`) }
}

const execute = async ({ spec, method, mode, params, output }) => {
  const decorators = get(spec)

  if (decorators.length > 0)
    return await some(decorators, async d => {
      if (typeof d.instance[mode] === 'function') {
        const args = { madul: spec, method }

        if (mode === 'before')
          args.params = params
        else if (mode === 'after')
          args.output = output

        return await d.instance[mode](args) !== true
      } else
        return false
    }) === false
  else
    return true
}

exports.get      = get
exports.add      = add
exports.init     = init
exports.reset    = reset
exports.remove   = remove
exports.getAll   = getAll
exports.addAll   = addAll
exports.resetAll = resetAll

exports.execute            = execute
exports.loadFromBundle     = loadFromBundle
exports.loadFromAllBundles = loadFromAllBundles