const {
  add,
  get,
  init,
  reset,
  remove,
  getAll,
  addAll,
  resetAll,
} = require('../lib/CollectionManager')('test', { })

init('/example')
init('/decorator')
init('/anotherDecorator')

describe('CollectionManager', () => {
  afterEach(resetAll)

  describe('init', () => {
    it('is a function', () =>
      expect(init).to.be.a('function')
    )

    it('creates an empty array of decorators for the specified madul', () => {
      try { get('/decorator') }
      catch (e) { expect(e.message).to.equal('/decorator has not yet had its test collection initialized') }

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

    it('returns collection for the passed key', async () => {
      await add('/example', '/decorator')

      const collection = get('/example')
      
      expect(Array.isArray(collection)).to.be.true
      expect(collection[0].key).to.equal('/decorator')
      expect(collection[0].instance.before).to.be.a('function')
      expect(collection[0].instance.after).to.be.undefined
    })

    it('throws an error when the collection for the specified key does not exist', () => {
      try { get('/nonexistant') }
      catch (e) { expect(e.message).to.equal('/nonexistant has not yet had its test collection initialized') }
    })
  })

  describe('getAll', () => {
    it('is a function', () =>
      expect(getAll).to.be.a('function')
    )

    it('returns all collections as an object', async () => {
      await add('/example', '/decorator')

      const allCollections = getAll()

      // This is 3 because we make 3 init() calls before executing the tests
      expect(Object.keys(allCollections).length).to.equal(3)
      expect(Array.isArray(allCollections['/example'])).to.be.true
      expect(Array.isArray(allCollections['/decorator'])).to.be.true
      expect(allCollections['/example'].length).to.equal(1)
      expect(allCollections['/decorator'].length).to.equal(0)
    })
  })

  describe('add', () => {
    it('is a function', () =>
      expect(add).to.be.a('function')
    )

    it('adds the specified item to the collection for the specified key', async () => {
      const collection = get('/example')

      expect(Array.isArray(collection)).to.be.true
      expect(collection.length).to.equal(0)

      await add('/example', '/decorator')
      
      expect(Array.isArray(collection)).to.be.true
      expect(collection.length).to.equal(1)
      expect(collection[0].key).to.equal('/decorator')
      expect(collection[0].instance.before).to.be.a('function')
      expect(collection[0].instance.after).to.be.undefined
    })

    it('throws an error when the specified key already exists for the specified collection', async () => {
      await add('/example', '/decorator')

      try { await add('/example', '/decorator') }
      catch (e) {
        expect(e.message).to.equal('/decorator is already a test for /example')
      }
    })
  })

  describe('addAll', () => {
    it('is a function', () =>
      expect(addAll).to.be.a('function')
    )

    it('adds all specified items to the specified collection', async () => {
      await addAll('/example', ['/decorator', '/anotherDecorator'])

      const collection = get('/example')

      expect(Array.isArray(collection)).to.be.true
      expect(collection.length).to.equal(2)
      expect(collection[0].key).to.equal('/decorator')
      expect(collection[1].key).to.equal('/anotherDecorator')
    })
  })

  describe('reset', () => {
    it('is a function', () =>
      expect(reset).to.be.a('function')
    )

    it('resets the collection for the specified key to an empty array', async () => {
      const collection = get('/example')

      expect(collection.length).to.equal(0)

      await add('/example', '/decorator')

      expect(collection.length).to.equal(1)

      reset('/example')

      expect(Array.isArray(collection)).to.be.true
      expect(collection.length).to.equal(0)
    })
  })

  describe('resetAll', () => {
    it('is a function', () =>
      expect(resetAll).to.be.a('function')
    )

    it('resets all for all keys to empty arrays', async () => {
      await add('/example',   '/decorator')
      await add('/decorator', '/anotherDecorator')

      const exampleCollection   = get('/example')
      const decoratorCollection = get('/decorator')

      expect(exampleCollection.length).to.equal(1)
      expect(decoratorCollection.length).to.equal(1)

      resetAll()

      expect(exampleCollection.length).to.equal(0)
      expect(decoratorCollection.length).to.equal(0)
    })
  })

  describe('remove', () => {
    it('is a function', () =>
      expect(remove).to.be.a('function')
    )

    it("removes the specified item from the specified collection", async () => {
      await add('/example', '/decorator')
      await add('/example', '/anotherDecorator')

      const decorators = get('/example')

      expect(decorators.length).to.equal(2)

      remove('/example', '/decorator')

      expect(decorators.length).to.equal(1)
    })

    it('throws an error when the collection for the specified key does not exist', () => {
      try { remove('/decorator', '/anotherDecorator') }
      catch (e) { expect(e.message).to.equal('/decorator has not yet had its test collection initialized') }
    })
  })
})