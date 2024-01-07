import { Collection } from "./DependencySpec/types"

import { each } from "async"

export const strip = (name: string) =>
  name?.toLowerCase()?.replace(/\W+/g, '')

export const executeAndReset = async (
  list: Collection,
  key: string,
) => {
  await each(list.get(key), async (fn: CallableFunction) => await fn())
  list.reset(key)
}
