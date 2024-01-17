import { Madul, ParameterSet } from "../types"

import { wrap    } from "../MethodWrapper"
import   DependencyHydrator   from "../DependencyHydrator"

const prepare = async (
  spec: string,
  params: ParameterSet,
  madul: Madul,
  root: string,
  cb: CallableFunction,
) => {
  const hydrated =
    madul.hasOwnProperty('deps') ?
      await DependencyHydrator(madul.deps || [], params, root)
      :
      { }

  const wrapped = await wrap(spec, { ...madul, hydrated } as Madul, params)

  cb(Object.freeze(wrapped))
}

export default prepare