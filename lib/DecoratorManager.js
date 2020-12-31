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

const load = async spec => {
  const initialize = require('./Initializer')

  const root   = `${process.cwd()}/.madul`
  const status = await stat(root)

  if (status.isDirectory()) {
    await each(await readdir(root), async node => {
      const path  = `${root}/${node}`
      const nstat = await stat(path)

      if (nstat.isFile()) {
        const bundle = require(path)

        if (bundle.maduls.includes(spec))
          decorators[spec] = await map(bundle.decorators, async d => await initialize(d))
      }
    })
  }
}

const execute = async ({ spec, method, mode, params, output }) => {
  if (Array.isArray(decorators[spec]))
    return await some(decorators[spec], async d => {
      if (typeof d[mode] === 'function') {
        const args = { madul: spec, method }

        if (mode === 'before')
          args.params = params
        else if (mode === 'after')
          args.output = output

        return await d[mode](args) !== true
      }
    }) === false
  else
    return true
}

exports.load    = load
exports.execute = execute