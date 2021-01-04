const { each } = require('async')

const error = (key, type) =>
  new Error(`${key} has not yet had its ${type} collection initialized`)

module.exports = function(type, collection) {
  const methods = Object.freeze({
    init: key => {
      if (Array.isArray(collection[key]) === false)
        collection[key] = [ ]
  
      return collection[key]
    },
    get: key => {
      if (Array.isArray(collection[key]))
        return collection[key]
      else
        throw error(key, type)
    },
    getAll: () => collection,
    add: async (key, item) => {
      if (Array.isArray(collection[key]) === false)
        throw error(key, type)
  
      // I *really* don't like this, but I think it's worth it for
      // the simplicity and consistency it allows.
      // This collection manager *should not* know the types of the collections
      // it's responsible for. Maybe I'll think of a better way to handle this
      // eventually.
      if (typeof item === 'string') {
        if (collection[key].some(d => d.key === item) === false)
          collection[key].push({
            key:     item,
            instance: await require('./Initializer')(item)
          })
        else
          throw new Error(`${item} is already a ${type} for ${key}`)
      } else if (typeof item === 'function')
        collection[key].push(item)
    },
    addAll: async (key, list) => await each(list, async l => await self.add(key, l)),
    reset: key => {
      if (Array.isArray(collection[key]))
        // This is extremely important: We reset the collection[key] array this way so
        // that clients with references obtained via get() and getAll() will behave as expected.
        // If we just did collection[key] = [ ] then all references to this array would immediately
        // become stale, and clients would have no way of knowing that.
        // The connection to clients would be broken, and there would be no way for them to know they
        // needed to call get()/getAll() again to resync their reference(s).
        for (let i = 0; i < collection[key].length; i++)
          collection[key].pop()
    },
    resetAll: () => Object.keys(collection).forEach(function (d) { self.reset(d) }),
    remove: (key, decorator) => {
      if (Array.isArray(collection[key])) {
        const index = collection[key].indexOf(d => d.key === decorator)
        collection[key].splice(index, 1)
      } else
        throw error(key, type)
    }
  })

  const self = methods

  return methods
}