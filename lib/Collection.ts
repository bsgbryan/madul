import {
  type Dictionary,
  type ManagedCollections,
} from "#types"

const context: ManagedCollections<unknown> = { }

export const init = (
  collection: string,
): boolean => {
  if (Array.isArray(context[collection]) === false) {
    context[collection] = [ ]

    return true
  }
  else return false
}

export const reinit = (
  colleciton: string,
): boolean => {
  if (Array.isArray(context[colleciton])) {
    // This is extremely important: We reset the collection[key] array this way so
    // that clients with references obtained via get() and getAll() will behave as expected.
    // If we just did collection[key] = [ ] then all references to this array would immediately
    // become stale, and clients would have no way of knowing that.
    // The connection to clients would be broken, and there would be no way for them to know they
    // needed to call get()/getAll() again to resync their reference(s).
    const count = context[colleciton].length

    for (let i = 0; i < count; i++)
      context[colleciton].pop()

    return true
  }
  else return false
}

export const uninit = (
  collection: string,
): boolean => {
  if (Array.isArray(context[collection])) {
    delete context[collection]

    return true
  }
  else return false
}

export const manage = <T>(
  collection: string,
  item:       Dictionary<T> | Array<Dictionary<T>>,
): boolean => {
  init(collection)

  if (Array.isArray(item)) {
    for (const i of item)
      if (i.key !== null && context[collection].some(d => d.key === i.key))
        return false

    for (const i of item)
      manage<T>(collection, i)

    return true
  }
  else {
    if (item.key !== null && context[collection].some(d => d.key === item.key) === false) {
      context[collection].push({
        key:   item.key,
        value: item.value,
      })
  
      return true
    }
    else if (item.key === null) {
      context[collection].push({
        key:   null,
        value: item.value,
      })
  
      return true
    }
    else return false
  }
}

export const unmanage = (
  collection: string,
  key:        string,
): boolean => {
  if (Array.isArray(context[collection]) && context[collection].some(d => d.key === key)) {
    context[collection].splice(
      context[collection].findIndex((d: Dictionary<unknown>) => d.key === key),
      1
    )

    return true
  }
  else return false
}

export const managed = <T>(
  collection: string,
): Array<Dictionary<T>> | undefined => {
  if (Array.isArray(context[collection]))
    return context[collection] as Array<Dictionary<T>>
  else return undefined
}

export const item = <T>(
  collection: string,
  key:        string,
): T | undefined => {
  if (Array.isArray(context[collection]))
    return context[collection].find(m => m.key === key)?.value as T
  else return undefined
}

export const items = <T>(
  collection: string,
): Array<T> | undefined => {
  if (Array.isArray(context[collection]))
    return context[collection].map(c => c.value) as Array<T>
  else return undefined
}