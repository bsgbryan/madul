const {
  stat,
  readdir,
} = require('fs').promises

const {
  map,
  each,
  some,
} = require('async')

const decorators = { }

const loadFromAllBundles = async spec => {
  const root   = `${process.cwd()}/.madul`
  const status = await stat(root)

  clear(spec)

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
  if (Array.isArray(decorators[spec]) && decorators[spec].length > 0)
    return await some(decorators[spec], async d => {
      if (typeof d.madul[mode] === 'function') {
        const args = { madul: spec, method }

        if (mode === 'before')
          args.params = params
        else if (mode === 'after')
          args.output = output

        return await d.madul[mode](args) !== true
      }
    }) === false
  else
    return true
}

const get = spec => decorators[spec]

const getAll = () => decorators

const set = async (spec, list) => await each(list, async l => await add(spec, l))

const add = async (spec, decorator) => {
  if (decorators[spec] === undefined)
    clear(spec)

  if (decorators[spec].some(d => d.spec === decorator) === false)
    decorators[spec].push({
      spec:  decorator,
      madul: await require('./Initializer')(decorator)
    })
  else
    throw new Error(`${decorator} is already a decorator for ${spec}`)
}

const clear = spec => decorators[spec] = [ ]

const clearAll = () => decorators = { }

const remove = (spec, decorator) => {
  if (Array.isArray(decorators[spec]))
    decorators[spec] = decorators[spec].filter(d => d.spec !== decorator)
}

exports.get      = get
exports.set      = set
exports.add      = add
exports.clear    = clear
exports.remove   = remove
exports.getAll   = getAll
exports.execute  = execute
exports.clearAll = clearAll

exports.loadFromBundle     = loadFromBundle
exports.loadFromAllBundles = loadFromAllBundles