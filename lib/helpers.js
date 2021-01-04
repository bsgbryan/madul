const { each } = require('async')

const strip = name => name?.toLowerCase()?.replace(/\W+/g, '')

const executeAndReset = async (list, key) => {
  await each(list.get(key), async fn => await fn())
  list.reset(key)
}
exports.strip           = strip
exports.executeAndReset = executeAndReset