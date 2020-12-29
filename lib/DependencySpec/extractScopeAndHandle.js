const extractScopeAndHandle = (searchable, scope) => {
  let end = searchable.length

  if (searchable.indexOf('[') > 0)
    end = searchable.indexOf('[')

  return searchable[0] === scope.LOCAL ?
    [scope.LOCAL, searchable.substring(1, end)]
    :
    [scope.DEFAULT, searchable.substring(0, end)]
}

module.exports = extractScopeAndHandle