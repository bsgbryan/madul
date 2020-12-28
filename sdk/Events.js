const { EventEmitter2 } = require('eventemitter2')

const emitter = new EventEmitter2({ wildcard: true })

const on   = (event, callback) => emitter.on(event, callback)
const emit = (event, args    ) => emitter.emit(event, args)

const log   = (event, args) => emitter.emit(`log.${event}`,  args)
const warn  = (event, args) => emitter.emit(`warn.${event}`, args)

exports.on   = on
exports.emit = emit

exports.log  = log
exports.warn = warn