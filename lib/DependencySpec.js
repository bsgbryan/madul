const { strip } = require('./helpers')

const SCOPE = Object.freeze({
  NODE:    '~',
  LOCAL:   '/',
  DEFAULT: ''
})

const extractScopeAndHandleFrom = searchable => {
  let end = searchable.length

  if (searchable.indexOf('[') > 0)
    end = searchable.indexOf('[')

  if (searchable[0] === SCOPE.NODE)
    return [SCOPE.NODE, searchable.substring(1, end)]
  else if (searchable[0] === SCOPE.LOCAL)
    return [SCOPE.LOCAL, searchable.substring(1, end)]
  else
    return [SCOPE.DEFAULT, searchable.substring(0, end)]
}

const extractInitializerAndPrerequisites = before => {
  const [initializer, prerequisites] = before?.split(':') || [ ]

  return [initializer, prerequisites?.split(',') || [ ]]
}

const parse = spec => {
  const spacelessSpec = spec.replace(/\s+/g, '')

  const [identifier , before       ] = spacelessSpec.split('=')
  const [searchable , alias        ] = identifier.split('->')
  const [scope      , handle       ] = extractScopeAndHandleFrom(searchable)
  const [initializer, prerequisites] = extractInitializerAndPrerequisites(before)
  
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

const build = ({
  alias,
  handle,
  searchRoot = '',
  initializer,
  prerequisites
}) => {
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

exports.SCOPE = SCOPE
exports.parse = parse
exports.build = build

exports.extractScopeAndHandleFrom          = extractScopeAndHandleFrom
exports.extractInitializerAndPrerequisites = extractInitializerAndPrerequisites
