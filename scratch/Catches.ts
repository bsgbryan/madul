import { Err } from "../lib/Err"

import { type WrappedFunction } from "../lib/types"

export const dependencies = () => ({
  '+Throws': ['ohboy']
})

export const letsGO = ({ ohboy }: { ohboy: WrappedFunction }) => {
  try { ohboy() }
  catch (e) { return (e as unknown as Err).message }
}