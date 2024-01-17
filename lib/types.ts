export type BundleKey = 'decorators' | 'maduls'

export type SDK = {
  [fn: string]: CallableFunction
}

export type SDKLibrary = {
  [name: string]: SDK
}

export type MadulDictionary = {
  [name: string]: Madul | null
}

export type Madul = {
  deps?:     Array<string>
  hydrated?: MadulDictionary
  name:      string
  [property: string]: any
}

export type ParameterSet = {
  [name: string]: unknown
}

export type Dictionary<T> = {
  key:   string | null
  value: T
}

export type ManagedCollections<T> = {
  [key: string]: Array<Dictionary<T>>
}

export type Config = {
  sdk?: MadulDictionary
  root: string
}
