const available   = { }
const initialized = { }
const listeners   = { }

const underscore = value => value.replace(/\W+/g, '_')

const SEARCH_ROOTS        = { }
const WRAPPED             = { }
const INITIALIZERS       = { }
const HYDRATED            = { }
const HYRDATION_LISTENERS = { }
const LOCALS              = { }

const SKIP_WRAP = [
  'constructor',
  'initialize',
  'details',
  'fire',
  'warn',
  'listen',
  'set',
  'runtime_exception'
]

const RegisterInitializerFor = (cls, method) => {
  if (_INITIALIZERS[cls] === undefined)
    _INITIALIZERS[cls] = [ ]

  _INITIALIZERS[cls].push({ fn: method, called: false })
}

const IsWrapped = (cls, method) => {
  if (WRAPPED[cls] === undefined)
    WRAPPED[cls] = [ ]

  return WRAPPED[cls].indexOf(method) < 0
}


