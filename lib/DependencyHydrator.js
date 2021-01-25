const { each } = require('async')

const { parse } = require('./DependencySpec')

const hydrate = async (deps, params = {}, root = process.cwd()) => {
  return new Promise(async (resolve, reject) => {
    const output = { }

    await each(deps, async d => {
      const { ref, functions } = parse(d)

      try {
        const initialized = await require('./Bootstrapper')(d, params, { root })

        if (functions.length > 0)
          functions.forEach(f => output[f] = initialized[f])
        else
          output[ref] = initialized
      }
      catch (e) { reject(e) }
    })

    resolve(Object.freeze(output))
  })
}

module.exports = hydrate