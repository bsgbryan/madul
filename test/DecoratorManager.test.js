const { expect } = require('chai')

const initialize = require('../lib/Initializer')

const {
  execute,
  resetAll,
} = require('../lib/DecoratorManager')

describe('DecoratorManager', () => {
  afterEach(resetAll)

  describe('execute', () => {
    it('is a function', () =>
      expect(execute).to.be.a('function')
    )

    it('execute all decorators for a madul when any member is invoked', async () => {
      const test   = await initialize('/test')
      const before = await initialize('/testBefore')
      const after  = await initialize('/testAfter')

      await test.foo()

      const beforeRan = await before.didRun()
      const afterRan  = await after.didRun()

      expect(beforeRan).to.be.true
      expect(afterRan).to.be.true
    })
  })
})