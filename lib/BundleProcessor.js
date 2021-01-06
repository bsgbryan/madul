const { readdir } = require('fs').promises
const { each    } = require('async')

const {
  add,
  init,
} = require('./DecoratorManager')

const { assign } = require('./SDKMapping')

const processAllBundles = async spec => {
  const root = `${process.cwd()}/.madul`

  init(spec)

  await each(await readdir(root), async node => await processBundle(spec, node))
}

const processBundle = async (spec, file) => {
  const path = `${process.cwd()}/.madul/${file}`

  init(spec)

  const bundle = require(path)

  if (bundle.maduls.includes(spec)) {
    await each(bundle.decorators, async d => await add(spec, d))

    if(typeof bundle.sdk === 'object')
      assign(spec, { ...bundle.sdk })
  }
}

exports.processBundle     = processBundle
exports.processAllBundles = processAllBundles