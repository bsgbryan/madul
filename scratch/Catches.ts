import { Err } from "#Err"

import { WrappedFunction } from "#types"

export const dependencies = () => ({
  '+Throws': ['ohboy']
})

export const letsGO = ({ ohboy }: { ohboy: WrappedFunction }) => {
  try { ohboy() }
  catch (e) { return (e as unknown as Err).message }
}