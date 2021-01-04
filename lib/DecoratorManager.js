const {
  stat,
  readdir,
} = require('fs').promises

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
  const root   = `${process.cwd()}/.madul`
  const status = await stat(root)

  init(spec)

  if (status.isDirectory()) {
    await each(await readdir(root), async node => await loadFromBundle(spec, node))
  }
}

const loadFromBundle = async (spec, bundle) => {
  const path   = `${process.cwd()}/.madul/${bundle}`
  const status = await stat(path)

  if (status.isFile()) {
    const bundle = require(path)

    if (bundle.maduls.includes(spec))
      await each(bundle.decorators, async d => await add(spec, d))
  } else
    throw new Error(`${path} is not a valid bundle file`)
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
        throw new Error(`${d.key}.${mode} is not a valid decorator function`)
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