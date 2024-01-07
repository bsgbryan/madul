import { SCOPE } from "./types"

const extractScopeAndHandle = (
  searchable: string,
) => {
  let end = searchable.length

  if (searchable.indexOf('[') > 0)
    end = searchable.indexOf('[')

  return searchable[0] === SCOPE.LOCAL ?
    [SCOPE.LOCAL, searchable.substring(1, end)]
    :
    [SCOPE.DEFAULT, searchable.substring(0, end)]
}


export default extractScopeAndHandle