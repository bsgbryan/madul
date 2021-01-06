const { expect } = require('chai')

const bootstrap           = require('../lib/Bootstrapper')
const executeInitializers = require('../lib/Bootstrapper/executeInitializers')

describe('Madul', () => {
  describe('executeInitializers', () => {
    it('is a function', () =>
      expect(executeInitializers).to.be.a('function')
    )

    it('executes all methods starting with a $ found on a wrapped object', async () => {
      let calls = 0

      const ready = {
        /* NOTE: These methods *must* have been wrapped via MethodWrapper.wrap
                 for executeInitializers to work correctly. */
        $init: async () => Promise.resolve(calls++),
        $foo:  async () => Promise.resolve(calls++),

      }

      await executeInitializers(ready)
      
      expect(calls).to.equal(2)
    })
  })

  describe('bootstrap', () => {
    it('is a function', () =>
      expect(bootstrap).to.be.a('function')
    )
  })
})