const { expect } = require('chai')

const initialize = require('../lib/Initializer')

const {
  get,
  init,
  execute,
  resetAll,
  loadFromBundle,
  loadFromAllBundles,
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

  describe('loadFromBundle', () => {
    it('is a function', () =>
      expect(loadFromBundle).to.be.a('function')
    )

    it('adds the decorators listed in the specified bundle to the specified spec', async () => {
      init('/example')

      const decorators = get('/example')

      expect(decorators.length).to.equal(0)

      await loadFromBundle('/example', 'example.bundle.js')

      expect(decorators.length).to.equal(1)
      expect(decorators[0].key).to.equal('/decorator')
    })

    it("throws an error when the specified bundle file doesn't exist", async () => {
      try { await loadFromBundle('/example', 'does.not.exist') }
      catch (e) { expect(e.message).to.equal(`${process.cwd()}/.madul/does.not.exist does not exist`) }
    })
  })

  describe('loadFromAllBundles', () => {
    it('is a function', () =>
      expect(loadFromAllBundles).to.be.a('function')
    )

    it('adds the decorators from all bundle to the specified spec', async () => {
      const decorators = get('/example')

      expect(decorators.length).to.equal(0)

      await loadFromAllBundles('/example')

      expect(decorators.length).to.equal(2)
    })
  })
})