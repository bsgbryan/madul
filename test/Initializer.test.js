const { expect } = require('chai')

const initialize  = require('../lib/Initializer')

const {
  execute$,
} = initialize

describe('Madul', () => {
  describe('execute$', () => {
    it('is a function', () =>
      expect(execute$).to.be.a('function')
    )

    it('executes all methods starting with a $ found on a wrapped object', async () => {
      let calls = 0

      const ready = {
        /* NOTE: These methods *must* have been wrapped via MethodWrapper.wrap
                 for execute$ to work correctly. */
        $init: async () => Promise.resolve(calls++),
        $foo:  async () => Promise.resolve(calls++),

      }

      await execute$(ready)
      
      expect(calls).to.equal(2)
    })
  })

  describe('initialize', () => {
    it('is a function', () =>
      expect(initialize).to.be.a('function')
    )
  })
})