const {
  get,
  add,
  init,
  reset,
  remove,
  getAll,
  addAll,
  resetAll,
} = require('../CollectionManager')('listener', { })

exports.get      = get
exports.add      = add
exports.init     = init
exports.reset    = reset
exports.remove   = remove
exports.getAll   = getAll
exports.addAll   = addAll
exports.resetAll = resetAll

