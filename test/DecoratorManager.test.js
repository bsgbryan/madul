const { expect } = require('chai')

const {
  add,
  get,
  init,
  reset,
  remove,
  getAll,
  addAll,
  resetAll,
} = require('../lib/DecoratorManager')

describe('DecoratorManager', () => {
  beforeEach(() => init('/example'))
  afterEach(resetAll)

  describe('init', () => {
    it('is a function', () =>
      expect(init).to.be.a('function')
    )

    it('creates an empty array of decorators for the specified madul', () => {
      try { get('/decorator') }
      catch (e) { expect(e.message).to.equal('/decorator has not yet had its decorator collection initialized') }

      init('/decorator')

      const decoratrors = get('/decorator')

      expect(Array.isArray(decoratrors)).to.be.true
      expect(decoratrors.length).to.equal(0)
    })
  })

  describe('get', () => {
    it('is a function', () =>
      expect(get).to.be.a('function')
    )

    it('returns decorators for the passed madul dependency spec', async () => {
      await add('/example', '/decorator')

      const decorators = get('/example')
      
      expect(Array.isArray(decorators)).to.be.true
      expect(decorators[0].spec).to.equal('/decorator')
      expect(decorators[0].instance.before).to.be.a('function')
      expect(decorators[0].instance.after).to.be.undefined
    })

    it('throws an error when the decorator collection for the specified madul does not exist', () => {
      try { get('/nonexistant') }
      catch (e) { expect(e.message).to.equal('/nonexistant has not yet had its decorator collection initialized') }
    })
  })

  describe('getAll', () => {
    it('is a function', () =>
      expect(getAll).to.be.a('function')
    )

    it('returns all decoratrors as an object', async () => {
      await add('/example', '/decorator')

      const allDecorators = getAll()

      // This is 2 because add() calls initialize(), which calls loadFromAllBundles().
      // Since decorators are maduls, when a decorator is initialized, it is added
      // to the decorators object. Decorators can have decorators. 🤯
      expect(Object.keys(allDecorators).length).to.equal(2)
      expect(Array.isArray(allDecorators['/example'])).to.be.true
      expect(Array.isArray(allDecorators['/decorator'])).to.be.true
      expect(allDecorators['/example'].length).to.equal(1)
      // We haven't called add('/decorator', anotherDecorator), so this array is empty
      expect(allDecorators['/decorator'].length).to.equal(0)
    })
  })

  describe('add', () => {
    it('is a function', () =>
      expect(add).to.be.a('function')
    )

    it('adds the specified decorator to the list of decorators for the specified madul', async () => {
      const decorators = get('/example')

      expect(Array.isArray(decorators)).to.be.true
      expect(decorators.length).to.equal(0)

      await add('/example', '/decorator')
      
      expect(Array.isArray(decorators)).to.be.true
      expect(decorators.length).to.equal(1)
      expect(decorators[0].spec).to.equal('/decorator')
      expect(decorators[0].instance.before).to.be.a('function')
      expect(decorators[0].instance.after).to.be.undefined
    })

    it('throws an error when the specified decorator already exists for the specified madul', async () => {
      await add('/example', '/decorator')

      try { await add('/example', '/decorator') }
      catch (e) {
        expect(e.message).to.equal('/decorator is already a decorator for /example')
      }
    })
  })

  describe('addAll', () => {
    it('is a function', () =>
      expect(addAll).to.be.a('function')
    )

    it('adds all specified decorators to the specified madul', async () => {
      await addAll('/example', ['/decorator', '/anotherDecorator'])

      const decorators = get('/example')

      expect(Array.isArray(decorators)).to.be.true
      expect(decorators.length).to.equal(2)
      expect(decorators[0].spec).to.equal('/decorator')
      expect(decorators[1].spec).to.equal('/anotherDecorator')
    })
  })

  describe('reset', () => {
    it('is a function', () =>
      expect(reset).to.be.a('function')
    )

    it('resets the decorators for the specified madul to an empty array', async () => {
      const decorators = get('/example')

      expect(decorators.length).to.equal(0)

      await add('/example', '/decorator')

      expect(decorators.length).to.equal(1)

      reset('/example')

      expect(Array.isArray(decorators)).to.be.true
      expect(decorators.length).to.equal(0)
    })
  })

  describe('resetAll', () => {
    it('is a function', () =>
      expect(resetAll).to.be.a('function')
    )

    it('resets the decorators for all maduls to empty arrays', async () => {
      await add('/example',   '/decorator')
      await add('/decorator', '/anotherDecorator')

      const exampleDecorators   = get('/example')
      const decoratorDecorators = get('/decorator')

      expect(exampleDecorators.length).to.equal(1)
      expect(decoratorDecorators.length).to.equal(1)

      resetAll()

      expect(exampleDecorators.length).to.equal(0)
      expect(decoratorDecorators.length).to.equal(0)
    })
  })

  describe('remove', () => {
    it('is a function', () =>
      expect(remove).to.be.a('function')
    )

    it("removes the specified decorator from the specified madul's collection", async () => {
      await add('/example', '/decorator')
      await add('/example', '/anotherDecorator')

      const decorators = get('/example')

      expect(decorators.length).to.equal(2)

      remove('/example', '/decorator')

      expect(decorators.length).to.equal(1)
    })

    it('throws an error when the collection for the specified madul does not exist', () => {
      try { remove('/decorator', '/anotherDecorator') }
      catch (e) { expect(e.message).to.equal('/decorator has not yet had its decorator collection initialized') }
    })
  })
})