const { readdir } = require('fs').promises
const { each    } = require('async')

const {
  add,
  init,
} = require('./DecoratorManager')

const { assign } = require('./SDKMapping')

const { log } = require('../sdk/Events')

const processAllBundles = async spec => {
  const root = `${process.cwd()}/.madul`

  init(spec)

  try { await each(await readdir(root), async node => await processBundle(spec, node)) }
  catch (e) {
    if (e.code === 'ENOENT')
      log('No madul config directory found')
  }
}

const processBundle = async (spec, file) => {
  const path   = `${process.cwd()}/.madul/${file}`
  const bundle = require(path)

  init(spec)

  if (bundle?.maduls?.includes(spec)) {
    if (Array.isArray(bundle.decorators))
      await each(bundle.decorators, async d => await add(spec, d))

    if(typeof bundle.sdk === 'object')
      assign(spec, { ...bundle.sdk })
  }
}

exports.processBundle     = processBundle
exports.processAllBundles = processAllBundles