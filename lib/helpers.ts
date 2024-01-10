import {
  get,
  resetAll,
} from "./CollectionManager"

export const executeAndReset = async (
  key: string,
  item: string,
) => {
  const listener = get(key, item) as CallableFunction

  if (listener) await listener()

  resetAll(key)
}
