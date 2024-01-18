export type MadulDictionary = {
  [name: string]: Madul | null
}

export type Madul = {
  deps?:     Array<string>
  hydrated?: MadulDictionary
  [property: string]: any
}

export type ParameterSet = {
  [name: string]: unknown
}

export type FunctionObjectLiteral = {
  [key: string]: CallableFunction
}
