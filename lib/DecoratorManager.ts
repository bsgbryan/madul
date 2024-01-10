import {
  DecoratorManagerProps,
  Dictionary,
  Madul,
} from "./types"

import { managed } from "./CollectionManager"

const DecoratorManager = async ({
  spec,
  method,
  mode,
  params,
  output,
}: DecoratorManagerProps) => {
  const decorators = managed<Madul>(`${spec}::DECORATORS`)?.
    map((d: Dictionary<unknown>) => d.value)?.
    find((d: unknown) => typeof (d as Madul)[mode] === 'function')

  if (decorators) {
    const args = { madul: spec, method }

    if (mode === 'before')
      // @ts-ignore
      args.params = params
    else if (mode === 'after')
      // @ts-ignore
      args.output = output

    await (decorators as Madul)[mode](args)
  }
}

export default DecoratorManager
