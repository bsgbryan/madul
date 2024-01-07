export type Spec = {
  alias:         string
  functions:     Array<string>
  handle:        string
  initializer:   string
  prerequisites: Array<string>
  ref:           string
  scope:         string
}

export type BuildProps = {
  alias?:         string
  handle:         string
  searchRoot?:    string
  initializer?:   string
  prerequisites?: Array<string>
}

export type Collection = {
  get:      CallableFunction
  add:      CallableFunction
  init:     CallableFunction
  reset:    CallableFunction
  remove:   CallableFunction
  getAll:   CallableFunction
  addAll:   CallableFunction
  resetAll: CallableFunction
}

export enum SCOPE {
  LOCAL   = '/',
  DEFAULT = '',
}