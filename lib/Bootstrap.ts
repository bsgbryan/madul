import path from "node:path"

import {
  manage as add,
  items,
  uninit as remove,
} from "#Managed/Collection"

import Execute, {
  add as decorate,
} from "#Managed/Decorator"

import {
  DecoratorDictionary,
  DependencyDictionary,
  FunctionObjectLiteral,
  Madul,
  MadulDictionary,
  MadulSpec,
  Mode,
  ParameterSet,
} from "#types"

let config: { compilerOptions: { paths: { [key: string]: Array<string> }}}

export const Path = async (
  spec: string,
  root = process.cwd(),
) => {
  if (config === undefined) config = await Bun.file(`${root}/tsconfig.json`).json()

  const paths = config?.compilerOptions?.paths

  if (paths) {
    const prefix = Object.keys(paths).find(p => p.substring(0, p.length - 1) === spec[0])

    if (prefix) return path.normalize(`${root}/${paths[prefix][0].replace('*', spec.substring(1))}`)
    else throw new Error(`Could not build path for ${spec} from ${paths}`)
  }
  else throw new Error("No compilerOptions.paths defined in tsconfig.json")
}

export const ToObjectLiteral = (
  input: Map<string, CallableFunction>,
) => {
  return [...input.entries()].
    reduce((f, [k, v]) => (f[k] = v, f), {} as FunctionObjectLiteral)
}

export const HydratDependencies = async (
  dependencies: CallableFunction,
  params:       ParameterSet,
  root:         string,
  output:       Madul,
) => {
  const deps        = dependencies() as DependencyDictionary,
        boostrapped = { } as MadulDictionary

  for (const d of Object.keys(deps))
    boostrapped[d] = await Bootstrap(d, params, root)

  for (const [k, v] of Object.entries(deps))
    for (const d of v)
      output[d] = boostrapped[k]![d]
}

export const HydrateDecorators = async (
  spec:       string,
  decorators: CallableFunction,
  params:     ParameterSet,
  root:       string,
) => {
  for (const [fun, decs] of Object.entries(decorators() as DecoratorDictionary))
    for (const [mode, mads] of Object.entries(decs))
      for (const [mad, fns] of Object.entries(mads))
        for await (const fn of fns)
          decorate(spec, fun, mode as Mode, (await Bootstrap(mad, params, root))[fn])
}

export const ExtractFunctions = (
  mod:    Madul,
  output: Madul,
) => {
  return new Map(Object.
    entries({ ...mod, ...output }).
    filter(
      ([k, v]) => typeof v === 'function' && !k.startsWith('$')
    )
  ) as Map<string, CallableFunction>
}

export const ExecuteInitializers = async (
  spec:   string,
  mod:    Madul,
  params: ParameterSet,
  fns:    Map<string, CallableFunction>,
  output: Madul,
) => {
  const initers = Object.
    keys(mod).
    filter(i => typeof output[i] === 'function' && i[0] === '$')
      
  for (const i of initers) await DoWrapAsync(spec, fns, i)(params)
}

export const WrapAsync = (
  spec:   string,
  mod:    Madul,
  fns:    Map<string, CallableFunction>,
  output: Madul,
) => {
  const asyncFns = new Map(Object.
    entries(mod).
    filter(
      ([k, v]) => (v as CallableFunction).constructor.name === 'AsyncFunction' && !k.startsWith('$')
    )
  ) as Map<string, CallableFunction>

  for (const k of asyncFns.keys()) output[k] = DoWrapAsync(spec, fns, k, output)
}

export const DoWrapAsync = (
  spec:      string,
  functions: Map<string, Function>,
  fun:       string,
  self?:     Madul,
) => {
  return async (params?: ParameterSet) =>
    new Promise(async (resolve, reject) => {
      const input = { ...params, ...ToObjectLiteral(functions) } as ParameterSet

      try {
        await Execute(spec, fun, Mode.before, input)

        const fn     = functions.get(fun) as Function,
              output = await fn.call(undefined, { ...input, self }) as ParameterSet

        await Execute(spec, fun, Mode.after, output)

        resolve(output)
      }
      catch (e) { reject(e) }
    })
}

export const WrapSync = (
  mod:    Madul,
  fns:    Map<string, CallableFunction>,
  output: Madul,
) => {
  const syncFns = new Map(Object.
    entries(mod).
    filter(
      ([k, v]) => (v as CallableFunction).constructor.name === 'Function' && !k.startsWith('$')
    )
  ) as Map<string, CallableFunction>

  for (const k of syncFns.keys()) output[k] = DoWrapSync(fns, k, output)
}

export const DoWrapSync = (
  functions: Map<string, Function>,
  method:    string,
  self?:     Madul,
) => {
  return (params?: ParameterSet) => {
    const fn = functions.get(method) as Function

    return fn.call(undefined, { ...params, ...ToObjectLiteral(functions), self })
  }
}

const available: MadulDictionary = { }

const Bootstrap = async (
  spec: string,
  params = { } as ParameterSet,
  root   = process.cwd(),
): Promise<Madul> => {
  return new Promise(async (resolve, reject) => {
    const listeners = `${spec}::BOOTSTRAP_LISTENERS`,
          cb        = () => resolve(available[spec] as Madul),
          item      = { key: null, value: cb }

    switch (available[spec]) {
      case undefined:
        available[spec] = null

        add(listeners, item)

        try {
          const from   = await Path(spec, root),
                mod    = await import(from) as MadulSpec,
                output = { } as Madul

          if (typeof mod.dependencies === 'function')
            await HydratDependencies(mod.dependencies, params, root, output)

          if (typeof mod.decorators === 'function')
            await HydrateDecorators(spec, mod.decorators, params, root)

          const fns = ExtractFunctions(mod, output)

          await ExecuteInitializers(spec, mod, params, fns, output)

          WrapAsync(spec, mod, fns, output)
          WrapSync(mod, fns, output)

          available[spec] = output
          
          const callbacks = items<CallableFunction>(listeners)

          if (Array.isArray(callbacks))
            for (const done of callbacks) await done()

          remove(listeners)
        }
        catch (e) { reject(`Error loading ${spec}: ${e}`) }

        break
      case null:
        add(listeners, item)

        break
      default: cb()
    }
  })
}

export default Bootstrap
