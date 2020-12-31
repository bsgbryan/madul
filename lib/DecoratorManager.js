const {
  stat,
  readdir,
} = require('fs').promises

const {
  each,
  some,
} = require('async')

const decorators = { }

const load = async spec => {
  const initialize = require('./Initializer')

  const root   = `${process.cwd()}/.madul`
  const status = await stat(root)

  decorators[spec] = [ ]

  if (status.isDirectory()) {
    await each(await readdir(root), async node => {
      const path  = `${root}/${node}`
      const nstat = await stat(path)

      if (nstat.isFile() && path.endsWith('bundle.js')) {
        const bundle = require(path)

        if (bundle.maduls.includes(spec))
          await each(bundle.decorators, async d => {
            decorators[spec].push(await initialize(d))
          })
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