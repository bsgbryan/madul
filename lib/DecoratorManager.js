const { each } = require('async')

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

const execute = async ({ spec, method, mode, params, output }) =>
  await each(get(spec), async d => {
    if (typeof d.instance[mode] === 'function') {
      const args = { madul: spec, method }

      if (mode === 'before')
        args.params = params
      else if (mode === 'after')
        args.output = output

      await d.instance[mode](args)
    }
  })

exports.get      = get
exports.add      = add
exports.init     = init
exports.reset    = reset
exports.remove   = remove
exports.getAll   = getAll
exports.addAll   = addAll
exports.resetAll = resetAll

exports.execute = execute