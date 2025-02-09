import {
  Mode,
  type ParameterSet,
  type WrappedFunction,
} from "#types"

import {
  manage,
  managed,
  unmanage,
} from "#Collection"

import { type Dictionary } from "#types"

export const scope = (
  spec: string,
  fun:  string,
  mode: Mode,
) => `${spec}::${fun}::DECORATORS::${mode}`

export const add = (
  spec:      string,
  fun:       string,
  mode:      Mode,
  decorator: WrappedFunction,
) => {
  manage<WrappedFunction>(scope(spec, fun, mode), {
    key:   decorator._wrapped ? decorator._wrapped : decorator.name,
    value: decorator,
  })
}

export const remove = (
  spec: string,
  fun:  string,
  mode: Mode,
  name: string,
) => unmanage(scope(spec, fun, mode), name)

const Execute = async (
  spec:    string,
  fun:     string,
  mode:    Mode,
  params?: ParameterSet,
) => {
  const decorators = managed<WrappedFunction>(scope(spec, fun, mode))?.
    map((d: Dictionary<WrappedFunction>) => d.value)

  if (decorators) {
    const args: ParameterSet = { spec, fun }

    if (mode === 'before') args.input  = params
    if (mode === 'after' ) args.output = params

    for (const d of decorators) await d(args)
  }
}

export default Execute
