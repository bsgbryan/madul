const { each } = require('async')

const strip = name => name?.toLowerCase()?.replace(/\W+/g, '')

const executeAndDelete = (list, key) =>
  each(list[key], (fn, next) => {
    fn()
    next()
  }, () => list[key] = undefined)

exports.strip           = strip
exports.executeAndDelete = executeAndDelete