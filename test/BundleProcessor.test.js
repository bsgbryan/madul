const { expect } = require('chai')

const {
  get,
  init,
  resetAll,
} = require('../lib/DecoratorManager')

const {
  processBundle,
  processAllBundles,
} = require('../lib/BundleProcessor')

describe('BundleProcessor', () => {
  beforeEach(() => init('/example'))
  afterEach(resetAll)

  describe('processBundle', () => {
    it('is a function', () =>
      expect(processBundle).to.be.a('function')
    )

    it('adds the decorators listed in the specified bundle to the specified spec', async () => {
      const decorators = get('/example')

      expect(decorators.length).to.equal(0)

      await processBundle('/example', 'example.bundle.js')

      expect(decorators.length).to.equal(1)
      expect(decorators[0].key).to.equal('/decorator')
    })

    it("throws an error when the specified bundle file doesn't exist", async () => {
      try { await processBundle('/example', 'does.not.exist') }
      catch (e) { expect(e.message).to.have.string('Cannot find module') }
    })
  })

  describe('processAllBundles', () => {
    it('is a function', () =>
      expect(processAllBundles).to.be.a('function')
    )

    it('adds the decorators from all bundle to the specified spec', async () => {
      const decorators = get('/example')

      expect(decorators.length).to.equal(0)

      await processAllBundles('/example')

      expect(decorators.length).to.equal(2)
    })
  })
})