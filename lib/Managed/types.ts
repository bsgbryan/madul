export type Dictionary<T> = {
  key:   string | null
  value: T
}

export type ManagedCollections<T> = {
  [key: string]: Array<Dictionary<T>>
}