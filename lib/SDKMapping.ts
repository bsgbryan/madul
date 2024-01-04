import { SDK, SDKLibrary } from "./types"

const sdks: SDKLibrary = { }

export const assign = (spec: string, sdk: SDK) => sdks[spec] = { ...sdks[spec], ...sdk }
export const get    = (spec: string)           => sdks[spec]
