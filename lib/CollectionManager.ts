import { each } from "async"

import Bootstrap from "./Bootstrapper"

import {
  Dictionary,
  ManagedCollections,
} from "./types"

const collection: ManagedCollections<unknown> = { }

export const init = (key: string) => {
  if (Array.isArray(collection[key]) === false)
    collection[key] = [ ]
}

export const get = <T>(
  key:  string,
  item: string,
): T | undefined => {
  if (Array.isArray(collection[key]))
    return collection[key].find(m => m.key === item)?.value as T
  else return undefined
}

export const managed = <T>(key: string,) => {
  if (Array.isArray(collection[key]))
    // @ts-ignore
    return collection[key]
}

export const getAll = <T>(key: string): Array<Dictionary<T>> => collection[key] as Array<Dictionary<T>>

export const add = async (
  key:  string,
  item: string | CallableFunction,
): Promise<boolean> => {
  if (Array.isArray(collection[key]) === false)
    collection[key] = [ ]

  if (collection[key].some(d => d.key === item) === false) {
    collection[key].push({
      key:   typeof item === 'string' ? item : item.name,
      // @ts-ignore
      value: typeof item === 'string' ?
        await Bootstrap(item)
        :
        item,
    })

    return true
  }
  else return false
}

export const addAll = async (
  key:  string,
  list: Array<string>,
) => await each(list, async l => await add(key, l))

export const reset = (key: string): boolean => {
  if (Array.isArray(collection[key])) {
    // This is extremely important: We reset the collection[key] array this way so
    // that clients with references obtained via get() and getAll() will behave as expected.
    // If we just did collection[key] = [ ] then all references to this array would immediately
    // become stale, and clients would have no way of knowing that.
    // The connection to clients would be broken, and there would be no way for them to know they
    // needed to call get()/getAll() again to resync their reference(s).
    const count = collection[key].length

    for (let i = 0; i < count; i++)
      collection[key].pop()

    return true
  }
  else return false
}

export const resetAll = (key: string) => {
  for (const m of collection[key] || [])
    reset(m.key)
}

export const remove = <T>(
  key:  string,
  item: string,
) => {
  if (Array.isArray(collection[key])) {
    // @ts-ignore
    const index = collection[key].findIndex((d: Dictionary<T>) => d.key === item)
    collection[key].splice(index, 1)
  }
}