const {
  stat,
  readdir,
} = require('fs').promises

const {
  each,
  some,
} = require('async')

const decorators = { }

const loadFromAllBundles = async spec => {
  const root   = `${process.cwd()}/.madul`
  const status = await stat(root)

  if (Array.isArray(decorators[spec]) === false)
    decorators[spec] = [ ]

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
      if (typeof d.instance[mode] === 'function') {
        const args = { madul: spec, method }

        if (mode === 'before')
          args.params = params
        else if (mode === 'after')
          args.output = output

        return await d.instance[mode](args) !== true
      }
    }) === false
  else
    return true
}

const init = spec => {
  if (Array.isArray(decorators[spec]) === false)
    decorators[spec] = [ ]

  return decorators[spec]
}

const get = spec => {
  if (Array.isArray(decorators[spec]))
    return decorators[spec]
  else
    throw new Error(`${spec} has not yet had its decorator collection initialized`)
}

const getAll = () => decorators

const add = async (spec, decorator) => {
  if (Array.isArray(decorators[spec]) === false)
    throw new Error(`${spec} has not yet had its decorator collection initialized`)

  if (decorators[spec].some(d => d.spec === decorator) === false)
    decorators[spec].push({
      spec:     decorator,
      instance: await require('./Initializer')(decorator)
    })
  else
    throw new Error(`${decorator} is already a decorator for ${spec}`)
}

const addAll = async (spec, list) => await each(list, async l => await add(spec, l))

const reset = spec => {
  if (Array.isArray(decorators[spec]))
    // This is extremely important: We reset the decorators[spec] array this way so
    // that clients with references obtained via get() and getAll() will behave as expected.
    // If we just did decorators[spec] = [ ] then all references to this array would immediately
    // become stale, and clients would have no way of knowing that.
    // The connection to clients would be broken, and there would be no way for them to know they
    // needed to call get()/getAll() again to resync their reference(s).
    for (let i = 0; i < decorators[spec].length; i++)
      decorators[spec].pop()
}

const resetAll = () => Object.keys(decorators).forEach(d => reset(d))

const remove = (spec, decorator) => {
  if (Array.isArray(decorators[spec])) {
    const index = decorators[spec].indexOf(d => d.spec === decorator)
    decorators[spec].splice(index, 1)
  } else
    throw new Error(`${spec} has not yet had its decorator collection initialized`)
}

exports.get      = get
exports.add      = add
exports.init     = init
exports.reset    = reset
exports.remove   = remove
exports.getAll   = getAll
exports.addAll   = addAll
exports.execute  = execute
exports.resetAll = resetAll

exports.loadFromBundle     = loadFromBundle
exports.loadFromAllBundles = loadFromAllBundles