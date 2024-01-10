import EventEmitter from "eventemitter3"

import { ParameterSet } from "../lib/types"

import { Callback } from "./types"

const emitter = new EventEmitter()

export const on   = (event: string, callback: Callback    ) => emitter.on(event, callback)
export const emit = (event: string, args:     ParameterSet) => emitter.emit(event, args)

export const log   = (event: string, args?: ParameterSet) => emitter.emit(`log.${event}`,  args)
export const warn  = (event: string, args?: ParameterSet) => emitter.emit(`warn.${event}`, args)

on.call     = (madul: string, method: string, callback: Callback) => emitter.on(`call.${madul}.${method}`,     callback)
on.done     = (madul: string, method: string, callback: Callback) => emitter.on(`done.${madul}.${method}`,     callback)
on.error    = (madul: string, method: string, callback: Callback) => emitter.on(`error.${madul}.${method}`,    callback)
on.progress = (madul: string, method: string, callback: Callback) => emitter.on(`progress.${madul}.${method}`, callback)

emit.call     = (madul: string, method: string, params: ParameterSet) => emitter.emit(`call.${madul}.${method}`,     params)
emit.done     = (madul: string, method: string, params: ParameterSet) => emitter.emit(`done.${madul}.${method}`,     params)
emit.error    = (madul: string, method: string, params: ParameterSet) => emitter.emit(`error.${madul}.${method}`,    params)
emit.progress = (madul: string, method: string, params: ParameterSet) => emitter.emit(`progress.${madul}.${method}`, params)
