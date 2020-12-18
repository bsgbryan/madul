import ee2 from 'eventemitter2'

const emitter = new ee2.EventEmitter2({ wildcard: true })

export const Fire   = (event, args    ) => emitter.emit(event, args)
export const Listen = (event, callback) => emitter.on(event, callback)