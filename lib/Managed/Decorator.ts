import {
  Mode,
  ParameterSet,
} from "#types"

import {
  manage,
  managed,
  unmanage,
} from "#Managed/Collection"

import { Dictionary } from "#Managed/types"

export const scope = (
  spec: string,
  fun:  string,
  mode: Mode,
) => `${spec}::${fun}::DECORATORS::${mode}`

export const add = (
  spec:      string,
  fun:       string,
  mode:      Mode,
  decorator: CallableFunction,
) => {
  manage<CallableFunction>(scope(spec, fun, mode), {
    key:   decorator.name,
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
  const decorators = managed<CallableFunction>(scope(spec, fun, mode))?.
    map((d: Dictionary<CallableFunction>) => d.value)

  if (decorators) {
    const args: ParameterSet = { spec, fun }

    if (mode === 'before') args.input  = params
    if (mode === 'after' ) args.output = params

    for (const d of decorators) await d(args)
  }
}

export default Execute
