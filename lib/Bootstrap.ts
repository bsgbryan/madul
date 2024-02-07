import EventEmitter from "node:events"

import path from "node:path"

import {
  manage as add,
  items,
  uninit as remove,
} from "#Managed/Collection"

import Execute, {
  add as decorate,
} from "#Managed/Decorator"

import err, {
  Err,
  emitSIGABRT,
  unhandled,
} from "#Err"

import { format } from "#Context"

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

const emitter = new EventEmitter()

emitter.on("SIGABRT", ({ message, details }) => {
  console.error(format(message, details))

  if (process.env.NODE_ENV !== 'test') process.exit(1)
})

let config: { compilerOptions: { paths: { [key: string]: Array<string> }}}

export const Emitter = () => emitter

export const Path = async (
  spec: string,
  root = process.cwd(),
) => {
  if (spec[0] === '!') return path.normalize(`${root}/${spec.substring(1)}`)
  else if (config === undefined) config = await Bun.file(`${root}/tsconfig.json`).json()

  const paths = config?.compilerOptions?.paths

  if (paths) {
    const prefix = Object.keys(paths).find(p => p.substring(0, p.length - 1) === spec[0])

    if (prefix) return path.normalize(`${root}/${paths[prefix][0].replace('*', spec.substring(1))}`)
    else if (spec.charCodeAt(0) > 96 && spec.charCodeAt(0) < 123) return spec
    else throw new Error(`Could not find ${spec[0]} in compilerOptions.paths: ${JSON.stringify(paths, null, 2)}`)
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

  for (const d of Object.keys(deps)) {
    if (d.endsWith('!')) {
      const use = d.substring(0, d.length - 1)

      boostrapped[use] = await import(use)
    }
    else boostrapped[d] = await Bootstrap(d, params, root)
  }

  for (const [k, v] of Object.entries(deps)) {
    let use = k

    if (k.endsWith('!')) use = k.substring(0, k.length - 1)

    for (const d of v) output[d] = boostrapped[use]![d]
  }
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
    filter(([k, v]) => typeof v === 'function').
    filter(([k, _]) => k !== 'dependencies' && k !== 'decorators')
  ) as Map<string, CallableFunction>
}

export const ExecuteInitializers = async (
  spec:    string,
  mod:     Madul,
  fns:     Map<string, CallableFunction>,
  params?: ParameterSet,
) => {
  const asyncInits = Object.
    keys(mod).
    filter(i => mod[i]?.constructor?.name === 'AsyncFunction' && i[0] === '$')
      
  for (const i of asyncInits) await DoWrapAsync(spec, fns, i)(params)

  const inits = Object.
    keys(mod).
    filter(i => mod[i]?.constructor?.name === 'Function' && i[0] === '$')
      
  for (const i of inits) await DoWrapSync(fns, i)(params)
}

export const WrapAsync = (
  spec:   string,
  mod:    Madul,
  fns:    Map<string, CallableFunction>,
  output: Madul,
) => {
  const asyncFns = new Map(Object.
    entries(mod).
    filter(([_, v]) => (v as CallableFunction).constructor.name === 'AsyncFunction').
    filter(([k, _]) => !k.startsWith('$')).
    filter(([k, _]) => k !== 'dependencies' && k !== 'decorators')
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
      const input = { ...params, ...ToObjectLiteral(functions), self, err: err(params) } as ParameterSet

      try {
        await Execute(spec, fun, Mode.before, input)

        const fn     = functions.get(fun) as Function,
              output = await fn.call(undefined, input) as ParameterSet

        await Execute(spec, fun, Mode.after, output)

        resolve(output)
      }
      catch (e) {
        const _ = e as unknown as Err

        if (unhandled()) {
          _.add(params || {})
          emitSIGABRT(_.params)
        }
        else {
          _.add(params || {})
          reject(_)
        }
      }
    })

  fn._wrapped = fun

  return fn
}

export const WrapSync = (
  mod:    Madul,
  fns:    Map<string, CallableFunction>,
  output: Madul,
) => {
  const syncFns = new Map(Object.
    entries(mod).
    filter(([_, v]) => (v as WrappedFunction).constructor.name === 'Function').
    filter(([k, _]) => !k.startsWith('$')).
    filter(([k, _]) => k !== 'dependencies' && k !== 'decorators')
  ) as Map<string, WrappedFunction>

  for (const k of syncFns.keys()) output[k] = DoWrapSync(fns, k, output)
}

export const DoWrapSync = (
  functions: Map<string, Function>,
  fun:       string,
  self?:     Madul,
): WrappedFunction => {
  const fn = (params?: ParameterSet) => {
    try {
      const delegate = functions.get(fun) as Function

      return delegate.call(undefined, {
        ...params,
        ...ToObjectLiteral(functions),
        self,
        err: err(params),
      })
    }
    catch (e) {
      const _ = e as unknown as Err

      if (unhandled()) {
        _.add(params || {})
        emitSIGABRT(_.params)
      }
      else throw _
    }
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
                proxy  = { } as Madul,
                output = { } as Madul

          if (typeof mod.dependencies === 'function')
            await HydrateDependencies(mod.dependencies, proxy, params, root)

          if (typeof mod.decorators === 'function')
            await HydrateDecorators(spec, mod.decorators, params, root)

          const fns = ExtractFunctions(mod, proxy)

          await ExecuteInitializers(spec, mod, fns, params)

          WrapAsync(spec, mod, fns, output)
          WrapSync(mod, fns, output)

          available[spec] = output
          
          const callbacks = items<CallableFunction>(listeners)

          if (Array.isArray(callbacks))
            for (const done of callbacks) await done()

          remove(listeners)
        }
        catch (e) {
          const msg = (e as unknown as Error).message

          reject(`Error loading ${spec}${msg ? `: ${msg}` : ''}`) }

        break
      case null:
        add(listeners, item)

        break
      default: cb()
    }
  })
}

export default Bootstrap
