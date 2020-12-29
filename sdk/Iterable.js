const {
  reduce,
  transform,
  reduceRight,
} = require('async')

const _async = require('async')

const methods = [
  'map',
  'each',
  'some',
  'every',
  'sortBy',
  'eachOf',
  'filter',
  'detect',
  'concat',
  'reject',
  'groupBy',
  'mapValues',
]

const iterable = list => {
  const api = { }

  methods.forEach(m => {
    api[m] = async item => _async[m](list, item)

    api[m].series = async  item         => _async[`${m}Series`](list,        item)
    api[m].limit  = async (limit, item) => _async[`${m}Limit`] (list, limit, item)
  });
  
  return {
    ...api,
    reduce:      async (item, initial = undefined) => reduce     (list, initial, item),
    reduceRight: async (item, initial = undefined) => reduceRight(list, initial, item),
    transform:   async  item                       => transform  (list,          item),
  }
}

module.exports = iterable