const { Fire  } = require('./Event')
const { strip } = require('./helpers')

const SCOPE = Object.freeze({
  NODE:    '~',
  LOCAL:   '.',
  DEFAULT: ''
})

const extractScopeAndHandleFrom = searchable => {
  if (searchable[0] === SCOPE.NODE)
    return [SCOPE.NODE, searchable.substr(1)]
  else if (searchable[0] === SCOPE.LOCAL)
    return [SCOPE.LOCAL, searchable.substr(1)]
  else
    return [SCOPE.DEFAULT, searchable]
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
  
  return {
    ref: alias || handle,
    alias,
    scope,
    handle,
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
    return Fire('!.Madul.dependency_spec.handle-required', { handle })
  
  if (Array.isArray(prerequisites) && prerequisites.length > 0 && initializer === undefined)
    return Fire('!.Madul.dependency_spec.prerequisites-require-initializer', {
      handle,
      prerequisites
    })

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