import path from "node:path"

import { each } from "async"

import {
  FunctionObjectLiteral,
  Madul,
  MadulDictionary,
  ParameterSet,
} from "@/types"

import {
  manage as add,
  items,
  uninit as remove,
} from "@/Managers/Collection"

import Execute from "@/Managers/Decorator"

let config: { compilerOptions: { paths: { [key: string]: Array<string> }}}

export const Path = async (
  spec: string,
  root = process.cwd(),
) => {
  if (config === undefined) config = await Bun.file(`${root}/tsconfig.json`).json()

  const paths = config?.compilerOptions?.paths

  if (paths) {
    const prefix = Object.keys(paths).find(
      p => p.substring(0, p.length - 2) === spec.split('/')[0]
    )

    if (prefix) {
      const start = spec.indexOf('/') + 1,
            local = paths[prefix][0].replace('*', spec.substring(start))

      return path.normalize(`${root}/${local}`)
    }
    else throw new Error(`Could not build path for ${spec} from ${paths}`)
  }
  else throw new Error("No compilerOptions.paths defined in tsconfig.json")
}

const toObjectLiteral = (
  input: Map<string, CallableFunction>,
) =>
  [...input.entries()].
    reduce((f, [k, v]) => (f[k] = v, f), {} as FunctionObjectLiteral)

export const WrapAsync = (
  spec: string,
  functions: Map<string, CallableFunction>,
  method: string,
  self?: Madul,
) =>
  async (params?: ParameterSet) =>
    new Promise(async (resolve, reject) => {
      const input = { ...params, ...toObjectLiteral(functions) } as ParameterSet

      try {
        await Execute(spec, method, 'before', input)

        // @ts-ignore
        const output = await functions[method].call(null, { ...input, self })

        await Execute(spec, method, 'after', output)

        resolve(output as ParameterSet)
      }
      catch (e) { reject(e) }
    })

export const WrapSync = (
  functions: Map<string, CallableFunction>,
  method: string,
  self?: Madul,
) =>
  (params?: ParameterSet) => {
    // @ts-ignore
    return functions.get(method).call(null, { ...params, ...toObjectLiteral(functions), self })
  }

const available: MadulDictionary = { }

const Bootstrap = async (
  spec: string,
  params = { } as ParameterSet,
  root   = process.cwd(),
): Promise<Madul> =>
  new Promise(async (resolve, reject) => {
    const listeners = `${spec}::LISTENERS`,
          cb        = () => resolve(available[spec] as Madul),
          item      = { key: null, value: cb }

    switch (available[spec]) {
      case undefined:
        available[spec] = null

        add(listeners, item)

        try {
          const from   = await Path(spec, root),
                mod    = await import(from),
                output = { } as Madul

          if (typeof mod.dependancies === 'function') {
            const deps     = mod.dependancies(),
                  hydrated = { } as MadulDictionary

            await each(Object.keys(deps), async d => {
              try { hydrated[d] = await Bootstrap(d, params, root) }
              catch (e) { reject(e) }
            })

            for (const dep of Object.keys(deps))
              for (const d of deps[dep])
                // @ts-ignore
                output[d] = hydrated[dep][d]
          }

          const fns = new Map(Object.
            entries({ ...mod, ...output }).
            filter(
              ([k, v]) => typeof v === 'function' && !k.startsWith('$')
            )
          ) as Map<string, CallableFunction>

          const initers = Object.keys(mod).filter(i => typeof output[i] === 'function' && i[0] === '$')
      
          for (const i of initers) WrapAsync(spec, fns, i)(params)

          const asyncFns = new Map(Object.
            entries(mod).
            filter(
              ([k, v]) => (v as CallableFunction).constructor.name === 'AsyncFunction' && !k.startsWith('$')
            )
          ) as Map<string, CallableFunction>
      
          for (const k of asyncFns.keys()) output[k] = WrapAsync(spec, fns, k, output)

          const syncFns = new Map(Object.
            entries(mod).
            filter(
              ([k, v]) => (v as CallableFunction).constructor.name === 'Function' && !k.startsWith('$')
            )
          ) as Map<string, CallableFunction>
      
          for (const k of syncFns.keys()) output[k] = WrapSync(fns, k, output)

          available[spec] = output
          
          const callbacks = items<CallableFunction>(listeners)

          if (Array.isArray(callbacks))
            for (const done of callbacks) await done()

          remove(listeners)
        }
        catch (e) { return reject(`Error loading ${spec}: ${e}`) }

        break
      case null:
        add(listeners, item)

        break
      default: cb()
    }
  })

export default Bootstrap
