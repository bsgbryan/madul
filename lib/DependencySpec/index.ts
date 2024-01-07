import {
  BuildProps,
  Spec,
} from "./types"

import { strip } from "../helpers"

import extractInitializerAndPrerequisites from "./extractInitializerAndPrerequisites"
import extractScopeAndHandle              from "./extractScopeAndHandle"

export const SCOPE = Object.freeze({
  LOCAL:   '/',
  DEFAULT: ''
})

export const parse = (spec: string): Spec => {
  const spacelessSpec = spec.replace(/\s+/g, '')

  const [identifier , before       ] = spacelessSpec.split('=')
  const [searchable , alias        ] = identifier.split('->')
  const [scope      , handle       ] = extractScopeAndHandle(searchable)
  const {initializer, prerequisites} = extractInitializerAndPrerequisites(before)
  
  const list      = identifier.split('[')[1]
  const functions = list?.
    substring(0, list.length - 1)?.
    split(',') || [ ]

  return {
    ref: alias || handle,
    alias,
    scope,
    handle,
    functions,
    initializer,
    prerequisites,
  }
}

export const build = ({
  alias,
  handle,
  searchRoot = '',
  initializer,
  prerequisites,
}: BuildProps) => {
  if (typeof handle !== 'string' || strip(handle)?.length === 0)
    throw new Error('A non-empty handle is required to create a Dependency Spec')
  
  if (Array.isArray(prerequisites) && prerequisites.length > 0 && initializer === undefined)
    throw new Error('Prerequisites require an initializer')

  let spec = `${searchRoot}${handle}`

  if (typeof alias === 'string' && strip(alias).length > 0)
    spec += ` -> ${alias}`
  
  if (typeof initializer === 'string' && strip(initializer).length > 0)
    spec += ` = ${initializer}`

  if (Array.isArray(prerequisites) && prerequisites.length > 0)
    spec += `:${prerequisites.join(',')}`

  return spec
}
