import {
  Dictionary,
  Madul,
  ParameterSet,
} from "./types"

import {
  manage,
  managed,
  unmanage,
} from "./CollectionManager"

export const add = (
  spec: string,
  decorator: Madul,
) => {
  manage<Madul>(`${spec}::DECORATORS`, {
    key: decorator.name,
    value: decorator,
  })
}

export const remove = (
  spec: string,
  name: string,
) => unmanage(`${spec}::DECORATORS`, name)

const Execute = async (
  spec:    string,
  method:  string,
  mode:   'before' | 'after',
  params?: ParameterSet,
  output?: ParameterSet,
) => {
  const decorators = managed<Madul>(`${spec}::DECORATORS`)?.
    map((d: Dictionary<Madul>) => d.value)?.
    filter((d: Madul) => typeof d[mode] === 'function')

  if (decorators) {
    const args: ParameterSet = { spec, method }

    if (mode === 'before') args.params = params
    if (mode === 'after' ) args.output = output

    for (const d of decorators) await d[mode](args)
  }
}

export default Execute
