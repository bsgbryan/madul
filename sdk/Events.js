const { EventEmitter2 } = require('eventemitter2')

const emitter = new EventEmitter2({ wildcard: true })

const on   = (event, callback) => emitter.on(event, callback)
const emit = (event, args    ) => emitter.emit(event, args)

const log   = (event, args) => emitter.emit(`log.${event}`,  args)
const warn  = (event, args) => emitter.emit(`warn.${event}`, args)

on.call     = (madul, method, callback) => emitter.on(`call.${madul}.${method}`,     callback)
on.done     = (madul, method, callback) => emitter.on(`done.${madul}.${method}`,     callback)
on.error    = (madul, method, callback) => emitter.on(`error.${madul}.${method}`,    callback)
on.progress = (madul, method, callback) => emitter.on(`progress.${madul}.${method}`, callback)

emit.call     = (madul, method, params) => emitter.emit(`call.${madul}.${method}`,     params)
emit.done     = (madul, method, params) => emitter.emit(`done.${madul}.${method}`,     params)
emit.error    = (madul, method, params) => emitter.emit(`error.${madul}.${method}`,    params)
emit.progress = (madul, method, params) => emitter.emit(`progress.${madul}.${method}`, params)

exports.on   = on
exports.emit = emit

exports.log  = log
exports.warn = warn