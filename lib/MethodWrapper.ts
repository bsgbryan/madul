import {
  Madul,
  ParameterSet,
} from "./types"

import { each } from "async"

import {
  record,
  bootstrap,
  // @ts-ignore
} from "../sdk/Invokation"

import { parse } from "./DependencySpec"

import DecoratorManager from "./DecoratorManager"

export const doWrap = (
  spec: string,
  instance: Madul,
  method: string,
  self?: Madul,
) =>
  async (params?: ParameterSet) =>
    new Promise(async (resolve, reject) => {
      const args       = { ...params, ...instance?.hydrated } as ParameterSet
      const invokation = record()
      const progress   = (params: ParameterSet) => invokation.update(spec, method, params)

      let doneCalled = false

      const done = async (output: ParameterSet) => {
        doneCalled = true

        try {
          await DecoratorManager({ mode: 'after', output, spec, method })
          invokation.complete(spec, method, output)
          resolve(output)
        }
        catch (e) {
          invokation.fail(spec, method, e)
          reject(e)
        }
      }

      try {
        await DecoratorManager({ mode: 'before', params: args, spec, method })
        invokation.invoke(spec, method, args)

        // @ts-ignore
        const result = await instance[method].call(null, { ...args, self, done, progress })

        process.nextTick(async () => {
          if (doneCalled === false)
            await done(result as ParameterSet)
        })
      }
      catch (e) {
        invokation.fail(spec, method, e)
        reject(e)
      }
    })

export const validate = (instance: Madul) => {
  if (Array.isArray(instance))
    throw new Error('An array cannot be wrapped')

  // @ts-ignore
  if (instance === false)
    throw new Error(`boolean is not a valid type`)

  if (instance === null)
    throw new Error('Cannot wrap null')

  if (instance === undefined)
    throw new Error('Cannot wrap undefined')

  if (typeof instance !== 'object' && typeof instance !== 'function')
    throw new Error(`${typeof instance} is not a valid type`)

  const fns = Object.keys(instance).filter(i => typeof instance[i] === 'function')

  if (typeof instance === 'object' && fns.length === 0)
    throw new Error('instance must contain at least one functional property')
}

export const wrap = async (
  spec: string,
  instance: Madul,
  params?: ParameterSet,
) =>
  new Promise(async (resolve, reject) => {
    try {
      validate(instance)

      await bootstrap()
    }
    catch (e) { return reject(e) }
    
    const deps   = instance.deps?.map((d: string) => parse(d).ref)
    const output = { } as Madul

    const initializers = Object.keys(instance).filter(i => {
      const isDep  = deps?.includes(i)
      const isFn   = typeof instance[i] === 'function'
      const isInit = i[0] === '$'
      
      return !isDep && isFn && isInit
    })

    await each(initializers, async i => {
      const extra = await doWrap(spec, instance, i, output)(params) as Madul

      for (const e of Object.keys(extra || { }))
      // @ts-ignore
        instance.hydrated[e] = extra[e]
    })

    const needsWrapping = Object.keys(instance).filter(n => {
      const isDep  = deps?.includes(n)
      const isFn   = typeof instance[n] === 'function'
      const isInit = n[0] === '$'
      
      return !isDep && isFn && !isInit && !n.includes('_')
    })

    for (const n of needsWrapping)
      output[n] = doWrap(spec, instance, n, output)

    const bare = Object.keys(instance).filter(b => {
      const isntDep = !deps?.includes(b)
      const isFn    = typeof instance[b] === 'function'
      
      return isntDep && isFn && b[0] === '_'
    })

    for (const b of bare)
      output[b] = (args: ParameterSet) => instance[b]({
        self: output,
        ...args,
        ...instance.hydrated,
      })

    resolve(Object.freeze(output))
  })
