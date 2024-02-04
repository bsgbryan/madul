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
  WrappedFunction,
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

export const HydrateDependencies = async (
  dependencies: CallableFunction,
  output:       Madul,
  params?:      ParameterSet,
  root?:        string,
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
  params?:    ParameterSet,
  root?:      string,
) => {
  for (const [fun, decs] of Object.entries(decorators() as DecoratorDictionary))
    for (const [mode, mads] of Object.entries(decs))
      for (const [mad, fns] of Object.entries(mads))
        for (const fn of fns)
          decorate(spec, fun, mode as Mode, (await Bootstrap(mad, params, root))[fn])
}

export const ExtractFunctions = (
  mod:    MadulSpec,
  output: Madul,
) => {
  return new Map(Object.
    entries({ ...mod, ...output }).
    filter(([k, v]) => typeof v === 'function' && !k.startsWith('$')).
    filter(([k, _]) => k !== 'dependencies' && k !== 'decorators')
  ) as Map<string, CallableFunction>
}

export const ExecuteInitializers = async (
  spec:    string,
  mod:     MadulSpec,
  output:  Madul,
  fns:     Map<string, CallableFunction>,
  params?: ParameterSet,
) => {
  const asyncInits = Object.
    keys(mod).
    filter(i => output[i].constructor.name === 'AsyncFunction' && i[0] === '$')
      
  for (const i of asyncInits) await DoWrapAsync(spec, fns, i)(params)

  const inits = Object.
    keys(mod).
    filter(i => output[i].constructor.name === 'Function' && i[0] === '$')
      
  for (const i of inits) await DoWrapSync(fns, i)(params)
}

export const WrapAsync = (
  spec:   string,
  mod:    MadulSpec,
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
): WrappedFunction => {
  const fn = async (params?: ParameterSet) =>
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

  fn._wrapped = fun

  return fn
}

export const WrapSync = (
  mod:    MadulSpec,
  fns:    Map<string, CallableFunction>,
  output: Madul,
) => {
  const syncFns = new Map(Object.
    entries(mod).
    filter(
      ([k, v]) => (v as WrappedFunction).constructor.name === 'Function' && !k.startsWith('$')
    )
  ) as Map<string, WrappedFunction>

  for (const k of syncFns.keys()) output[k] = DoWrapSync(fns, k, output)
}

export const DoWrapSync = (
  functions: Map<string, Function>,
  fun:       string,
  self?:     Madul,
): WrappedFunction => {
  const fn = (params?: ParameterSet) => {
    const fn = functions.get(fun) as Function

    return fn.call(undefined, { ...params, ...ToObjectLiteral(functions), self })
  }

  fn._wrapped = fun

  return fn
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
            await HydrateDependencies(mod.dependencies, output, params, root)

          if (typeof mod.decorators === 'function')
            await HydrateDecorators(spec, mod.decorators, params, root)

          const fns = ExtractFunctions(mod, output)

          await ExecuteInitializers(spec, mod, output, fns, params)

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
