const fs = require('fs').promises

const { each } = require('async')

const { parse            } = require('./DependencySpec')
const { initialize       } = require('./Madul')
const { executeAndDelete } = require('./helpers')

const completed = { }
const listeners = { }

const load = async (src) => {
  return new Promise(async resolve => {
    const mod = require(src)

    if (mod.name === 'Madul') {
      const mad = await initialize(mod)

      resolve(mad)
    } else
      process.nextTick(() => resolve(mod))
  })
}

const srcLocation = async (ref) => {
  const path = `${process.cwd()}/node_modules/${ref}`
  const pkg  = `${path}/package.json`
  const stat = await fs.stat(pkg)

  if (stat.isFile()) {
    const data = await fs.readFile(pkg, 'utf8')
    const json = JSON.parse(data)
    const main = json.main || json._main || 'index.js'

    return `${path}/${main}`
  }
}

const doHydrate = async (deps) => {
  return new Promise((resolve, reject) => {
    const output  = { }

    each(deps, async (d, next) => {
      try {
        const spec = parse(d)
        const src  = await srcLocation(spec.ref)

        output[spec.ref] = await load(src)
      } catch (e) {
        reject(e)
      } finally {
        next()
      }
    }, () => resolve(Object.freeze(output)))
  })
}

const hydrate = async (madul, deps) => {
  const name = madul.name
  const cb   = () => resolve(completed[name])

  return new Promise(async (resolve, reject) => {
    if (madul.hasOwnProperty('deps')) {  
      switch(completed[name]) {
        case undefined:
          completed[name] = null
          listeners[name] = [cb]
  
          try {
            completed[name] = await doHydrate(deps)
  
            executeAndDelete(listeners[name])
          } catch (e) {
            reject(e)
          }
  
          break
        case null:
          listeners[name].push(cb)
          break
        default:
          process.nextTick(cb)
      }
    } else
      resolve()
  })
}

exports.load        = load
exports.hydrate     = hydrate
exports.doHydrate   = doHydrate
exports.srcLocation = srcLocation