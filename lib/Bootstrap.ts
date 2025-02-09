import { readFile } from "node:fs/promises"
import path from "node:path"

import {
  type CommentJSONValue,
  parse,
} from "comment-json"

import {
  manage as add,
  items,
  uninit as remove,
} from "#Collection"

import { func } from "#Context"

import Execute, {
  add as decorate,
} from "#Decorator"

import err, {
  Err,
  handle,
  debug,
  print,
  unhandled,
} from "#Err"

import {
  type DebugConfig,
  type DecoratorDictionary,
  type DependencyDictionary,
  type FunctionObjectLiteral,
  type Madul,
  type MadulDictionary,
  type MadulSpec,
  Mode,
  type ParameterSet,
  type WrappedFunction,
} from "#types"

let tsconfig: CommentJSONValue

export const Path = async (
  spec: string,
  root = process.cwd(),
) => {
  if (spec[0] === '!') return path.normalize(`${root}/${spec.substring(1)}`)
  else if (tsconfig === undefined) {
    try {
      tsconfig = parse(await readFile(`${root}/tsconfig.json`, { encoding: 'utf8' }))
    } catch (e) {
      console.error('Could not load your tsconfig.json file:', (e as unknown as Error).message)

      process.exit(1)
    } 
  }

  // @ts-ignore
  const paths = tsconfig?.compilerOptions?.paths

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
  params?:      ParameterSet,
  root?:        string,
) => {
  const deps        = dependencies() as DependencyDictionary,
        boostrapped = { } as MadulDictionary,
        output      = { } as Madul

  for (const d of Object.keys(deps)) {
    if (d.endsWith('!')) {
      const use = d.substring(0, d.length - 1)

      boostrapped[use] = await import(use)
    }
    else boostrapped[d] = await Bootstrap(d, params, root)
  }

  for (const [k, v] of Object.entries(deps)) {
    let use = k

    for (const d of v) {
      output[d] = d[0].match(/[A-Z]/) ?
        boostrapped[use]!.default
        :
        boostrapped[use]![d]
    }
  }

  return output
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
    filter(([_, v]) => typeof v === 'function').
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
  spec: string,
  mod:  Madul,
  fns:  Map<string, CallableFunction>,
) => {
  const output   = { } as Madul,
        asyncFns = new Map(Object.
    entries(mod).
    filter(([_, v]) => (v as CallableFunction).constructor.name === 'AsyncFunction').
    filter(([k, _]) => !k.startsWith('$')).
    filter(([k, _]) => k !== 'dependencies' && k !== 'decorators')
  ) as Map<string, CallableFunction>

  for (const k of asyncFns.keys()) output[k] = DoWrapAsync(spec, fns, k, output)

  return output
}

export const WrapSync = (
  mod: Madul,
  fns: Map<string, CallableFunction>,
) => {
  const output  = { } as Madul,
        syncFns = new Map(Object.
    entries(mod).
    filter(([_, v]) => (v as WrappedFunction).constructor.name === 'Function').
    filter(([k, _]) => !k.startsWith('$')).
    filter(([k, _]) => k !== 'dependencies' && k !== 'decorators')
  ) as Map<string, WrappedFunction>

  for (const k of syncFns.keys()) output[k] = DoWrapSync(fns, k, output)

  return output
}

const _handle = (
  error:   unknown,
  params?: ParameterSet,
  reject?: CallableFunction,
) => {
  const _ = error instanceof Err === false ?
    Err.from(error, params)
    :
    error

  if (_.mode === 'DEBUGGING') debug(CONFIG)
  else if (unhandled()) handle(params)
  else if (reject) reject(_)
  else throw _
}

export const DoWrapAsync = (
  spec:      string,
  functions: Map<string, Function>,
  fun:       string,
  self?:     Madul,
): WrappedFunction => {
  const fn = async (params?: ParameterSet) =>
    new Promise(async (resolve, reject) => {
      const input = {
        ...params,
        ...ToObjectLiteral(functions),
        self,
        err: err(params),
        print: print(),
      } as ParameterSet

      try {
        await Execute(spec, fun, Mode.before, input)

        const fn     = functions.get(fun) as Function,
              output = await fn.call(undefined, input) as ParameterSet

        await Execute(spec, fun, Mode.after, output)

        resolve(output)
      }
      catch (e) { _handle(e, params, reject) }
    })

  fn._wrapped = fun
  fn.toString = () => func('AsyncFunction', fun)

  return fn
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
        print: print(),
      })
    }
    catch (e) { _handle(e, params) }
  }

  fn._wrapped = fun
  fn.toString = () => func('Function', fun)

  return fn
}

const available: MadulDictionary = { }

let CONFIG: DebugConfig

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
          if (CONFIG === undefined) {
            const conf = await import('./Config.js')

            CONFIG = {
              env:    await conf.env(),
              debug:  await conf.debug(),
              report: await conf.report(),
            }
          }

          const from   = await Path(spec, root),
                mod    = await import(from) as MadulSpec,
                proxy  = { } as Madul,
                output = { } as Madul

          if (typeof mod.dependencies === 'function') {
            const deps = await HydrateDependencies(mod.dependencies, params, root)

            for (const [k, v] of Object.entries(deps))
              proxy[k] = v
          }

          if (typeof mod.decorators === 'function')
            await HydrateDecorators(spec, mod.decorators, params, root)

          const fns = ExtractFunctions(mod, proxy)

          await ExecuteInitializers(spec, mod, fns, params)

          const aWrapped = WrapAsync(spec, mod, fns)
          const sWrapped = WrapSync(mod, fns)

          for (const [k, v] of Object.entries(aWrapped))
            output[k] = v

          for (const [k, v] of Object.entries(sWrapped))
            output[k] = v

          available[spec] = output
          
          const callbacks = items<CallableFunction>(listeners)

          if (Array.isArray(callbacks))
            for (const done of callbacks) await done()

          remove(listeners)
        }
        catch (e) {
          const msg = (e as unknown as Error).message

          reject(`Error loading ${spec}${msg ? `: ${msg}` : ''}`)
        }

        break
      case null:
        add(listeners, item)

        break
      default: cb()
    }
  })
}

export default Bootstrap
