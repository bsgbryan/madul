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
  [name: string]: Madul | null
}

type Hydratable = {
  hydrated: MadulDictionary
}

export type Madul = {
  deps?: Array<string>
  hydrated?: MadulDictionary
  [property: string]: any
}

export type ParameterSet = {
  [name: string]: unknown
}

export type DecoratorManagerProps = {
  spec:    string
  method:  string
  mode:    string
  params?: ParameterSet
  output?: ParameterSet
}

export type Dictionary<T> = {
  key:   string
  value: T
}

export type ManagedCollections<T> = {
  [key: string]: Array<Dictionary<T>>
}

export type Config = {
  sdk?: MadulDictionary
  root: string
}
