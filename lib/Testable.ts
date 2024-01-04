// @ts-ignore
import load  from "./Loader"

const testable = async (
  spec: string,
  sdk = {},
) => await load(spec, { root: process.cwd(), sdk })

export default testable