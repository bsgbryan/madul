export type MadulDictionary = {
  [name: string]: Madul | null
}

export type Madul = {
  [fun: string]: CallableFunction
}

export type MadulSpec = {
  dependencies?: CallableFunction
  decorators?:   CallableFunction
}

export type ParameterSet = {
  [name: string]: unknown
}

export type FunctionObjectLiteral = {
  [key: string]: CallableFunction
}

export enum Mode {
  after  = 'after',
  before = 'before',
}

export type DependencyDictionary = {
  [madul: string]: Array<string>
}

export type DecoratorDictionary = {
  [fun: string]: {
    [mode in Mode]: {
      [mad: string]: Array<string>
    }
  }
}
