const { expect } = require('chai')

const bootstrap = require('../lib/Bootstrapper')

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
      const test   = await bootstrap('/test')
      const before = await bootstrap('/testBefore')
      const after  = await bootstrap('/testAfter')

      await test.foo()

      const beforeRan = await before.didRun()
      const afterRan  = await after.didRun()

      expect(beforeRan).to.be.true
      expect(afterRan).to.be.true
    })
  })
})