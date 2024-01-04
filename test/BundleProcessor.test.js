import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test"

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
      expect(typeof processBundle).toBe('function')
    )

    it('adds the decorators listed in the specified bundle to the specified spec', async () => {
      const decorators = get('/example')

      expect(decorators.length).toEqual(0)

      await processBundle('/example', 'example.bundle.js')

      expect(decorators.length).toEqual(1)
      expect(decorators[0].key).toEqual('/decorator')
    })

    it("throws an error when the specified bundle file doesn't exist", async () => {
      try { await processBundle('/example', 'does.not.exist') }
      catch (e) { expect(e.message).toContain('Cannot find module') }
    })
  })

  describe('processAllBundles', () => {
    it('is a function', () =>
      expect(typeof processAllBundles).toBe('function')
    )

    it('adds the decorators from all bundles to the specified spec', async () => {
      const decorators = get('/example')

      expect(decorators.length).toEqual(0)

      await processAllBundles('/example')

      expect(decorators.length).toEqual(2)
    })
  })
})