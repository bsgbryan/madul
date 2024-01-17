import {
  items,
  uninit,
} from "./CollectionManager"

export const executeAndReset = async (
  key: string,
) => {
  const listeners = items<CallableFunction>(key)

  if (Array.isArray(listeners))
    for (const l of listeners) await l()

  uninit(key)
}
