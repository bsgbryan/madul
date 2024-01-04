import {
  describe,
  expect,
  it,
} from "bun:test"

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
      expect(typeof init).toBe('function')
    )

    it('creates an empty array of decorators for the specified madul', () => {
      try { get('/decorator') }
      catch (e) { expect(e.message).toEqual('/decorator has not yet had its test collection initialized') }

      init('/decorator')

      const decoratrors = get('/decorator')

      expect(Array.isArray(decoratrors)).toBeTruthy()
      expect(decoratrors.length).toEqual(0)
    })
  })

  describe('get', () => {
    it('is a function', () =>
      expect(typeof get).toBe('function')
    )

    it('returns collection for the passed key', async () => {
      await add('/example', '/decorator')

      const collection = get('/example')
      
      expect(Array.isArray(collection)).toBeTruthy()
      expect(collection[0].key).toEqual('/decorator')
      expect(typeof collection[0].instance.before).toBe('function')
      expect(collection[0].instance.after).toBeUndefined()
    })

    it('throws an error when the collection for the specified key does not exist', () => {
      try { get('/nonexistant') }
      catch (e) { expect(e.message).toEqual('/nonexistant has not yet had its test collection initialized') }
    })
  })

  describe('getAll', () => {
    it('is a function', () =>
      expect(typeof getAll).toBe('function')
    )

    it('returns all collections as an object', async () => {
      await add('/example', '/decorator')

      const allCollections = getAll()

      // This is 3 because we make 3 init() calls before executing the tests
      expect(Object.keys(allCollections).length).toEqual(3)
      expect(Array.isArray(allCollections['/example'])).toBeTruthy()
      expect(Array.isArray(allCollections['/decorator'])).toBeTruthy()
      expect(allCollections['/example'].length).toEqual(1)
      expect(allCollections['/decorator'].length).toEqual(0)
    })
  })

  describe('add', () => {
    it('is a function', () =>
      expect(typeof add).toBe('function')
    )

    it('adds the specified item to the collection for the specified key', async () => {
      const collection = get('/example')

      expect(Array.isArray(collection)).toBeTruthy()
      expect(collection.length).toEqual(0)

      await add('/example', '/decorator')
      
      expect(Array.isArray(collection)).toBeTruthy()
      expect(collection.length).toEqual(1)
      expect(collection[0].key).toEqual('/decorator')
      expect(typeof collection[0].instance.before).toBe('function')
      expect(collection[0].instance.after).toBeUndefined()
    })

    it('throws an error when the specified key already exists for the specified collection', async () => {
      await add('/example', '/decorator')

      try { await add('/example', '/decorator') }
      catch (e) {
        expect(e.message).toEqual('/decorator is already a test for /example')
      }
    })
  })

  describe('addAll', () => {
    it('is a function', () =>
      expect(typeof addAll).toBe('function')
    )

    it('adds all specified items to the specified collection', async () => {
      await addAll('/example', ['/decorator', '/anotherDecorator'])

      const collection = get('/example')

      expect(Array.isArray(collection)).toBeTruthy()
      expect(collection.length).toEqual(2)
      expect(collection[0].key).toEqual('/decorator')
      expect(collection[1].key).toEqual('/anotherDecorator')
    })
  })

  describe('reset', () => {
    it('is a function', () =>
      expect(typeof reset).toBe('function')
    )

    it('resets the collection for the specified key to an empty array', async () => {
      const collection = get('/example')

      expect(collection.length).toEqual(0)

      await add('/example', '/decorator')

      expect(collection.length).toEqual(1)

      reset('/example')

      expect(Array.isArray(collection)).toBeTruthy()
      expect(collection.length).toEqual(0)
    })
  })

  describe('resetAll', () => {
    it('is a function', () =>
      expect(typeof resetAll).toBe('function')
    )

    it('resets all for all keys to empty arrays', async () => {
      await add('/example',   '/decorator')
      await add('/decorator', '/anotherDecorator')

      const exampleCollection   = get('/example')
      const decoratorCollection = get('/decorator')

      expect(exampleCollection.length).toEqual(1)
      expect(decoratorCollection.length).toEqual(1)

      resetAll()

      expect(exampleCollection.length).toEqual(0)
      expect(decoratorCollection.length).toEqual(0)
    })
  })

  describe('remove', () => {
    it('is a function', () =>
      expect(typeof remove).toBe('function')
    )

    it("removes the specified item from the specified collection", async () => {
      await add('/example', '/decorator')
      await add('/example', '/anotherDecorator')

      const decorators = get('/example')

      expect(decorators.length).toEqual(2)

      remove('/example', '/decorator')

      expect(decorators.length).toEqual(1)
    })

    it('throws an error when the collection for the specified key does not exist', () => {
      try { remove('/decorator', '/anotherDecorator') }
      catch (e) { expect(e.message).toEqual('/decorator has not yet had its test collection initialized') }
    })
  })
})