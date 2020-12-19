const { EventEmitter2 } = require('eventemitter2')

const emitter = new EventEmitter2({ wildcard: true })

exports.Fire   = (event, args    ) => emitter.emit(event, args)
exports.Listen = (event, callback) => emitter.on(event, callback)