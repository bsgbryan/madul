export type BundleKey = 'decorators' | 'maduls'

export type SDK = {
  [fn: string]: CallableFunction
}

export type SDKLibrary = {
  [name: string]: SDK
}

type MaybeHasDeps = {
  deps?: Array<string>
}

type HasMethods = {
  [method: string]: CallableFunction
}

export type MadulDictionary = {
  [name: string]: Madul
}

type Hydratable = {
  hydrated: MadulDictionary
}

export type Madul = MaybeHasDeps & HasMethods & Hydratable

export type ParameterSet = {
  [name: string]: unknown
}