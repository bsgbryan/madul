import {
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test"

import {
  manage,
  item,
  init,
  reinit,
  unmanage,
  managed,
  uninit,
} from "@/Managers/Collection"

describe('CollectionManager', () => {
  beforeEach(() => uninit('::DECORATOR::'))

  describe('init', () => {
    it('is a function', () =>
      expect(typeof init).toBe('function')
    )

    it('returns true when the specified collection is successfully created', () => {
      expect(init('::DECORATOR::')).toBeTruthy()
    })

    it('returns false when the specified collection is not successfully created', () => {
      // Since we call init here, the ::DECORATOR:: collection will already exist
      // in the expect() below
      init('::DECORATOR::')

      expect(init('::DECORATOR::')).toBeFalsy()
    })

    it('creates an empty array of decorators for the specified madul', () => {
      expect(managed('::DECORATOR::')).toBeUndefined()

      init('::DECORATOR::')

      const decoratrors = managed('::DECORATOR::')

      expect(Array.isArray(decoratrors)).toBeTruthy()
      expect(decoratrors?.length).toEqual(0)
    })
  })

  describe('reinit', () => {
    it('is a function', () =>
      expect(typeof reinit).toBe('function')
    )

    describe('when the passed key exists', () => {
      it('returns true: indicating all items in the collection were removed', () => {
        init('::DECORATOR::')
  
        const collection = managed('::DECORATOR::')
  
        expect(collection?.length).toEqual(0)
  
        manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })
  
        expect(collection?.length).toEqual(1)
  
        expect(reinit('::DECORATOR::')).toBeTruthy()
        expect(Array.isArray(collection)).toBeTruthy()
        expect(collection?.length).toEqual(0)
      })

      it('resets the collection for the specified key to an empty array', () => {
        init('::DECORATOR::')
  
        const collection = managed('::DECORATOR::')
  
        expect(collection?.length).toEqual(0)
  
        manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })
  
        expect(collection?.length).toEqual(1)
  
        reinit('::DECORATOR::')
  
        expect(Array.isArray(collection)).toBeTruthy()
        expect(collection?.length).toEqual(0)
      })
    })

    describe('when the passed key does not exist', () => {
      it('returns false', () => {
        expect(reinit('::BAD::')).toBeFalsy()
      })
    })
  })

  describe('uninit', () => {
    describe('when the specified collection exists', () => {
      it('returns true: indicating the collection was deleted', () => {
        init('::DECORATOR::')

        expect(uninit('::DECORATOR::')).toBeTruthy()
      })

      it('is deleted', () => {
        init('::DECORATOR::')

        uninit('::DECORATOR::')

        expect(managed('::DECORATOR::')).toBeUndefined()
      })
    })

    describe('when the specified collection does not exist', () => {
      it('returns false', () => {
        expect(uninit('::BADD::')).toBeFalsy()
      })
    })
  })

  describe('manage', () => {
    it('is a function', () =>
      expect(typeof manage).toBe('function')
    )

    describe('when item is not an array', () => {
      describe('when the specified item already exists in the collection', () => {
        it('return false: indicating the item was not added', async () => {
          init('::DECORATOR::')
    
          manage<string>('::DECORATOR::', { key: 'bar', value: 'bar' })
    
          expect(manage<string>('::DECORATOR::', { key: 'bar', value: 'bar' })).toBeFalsy()
        })
      })
  
      describe('when the specified item does not exist in the collection', () => {
        it('return true: indicating the item was added', async () => {
          init('::DECORATOR::')
    
          expect(manage<string>('::DECORATOR::', { key: 'bar', value: 'bar' })).toBeTruthy()
        })
      })
  
      it('adds the specified item to the collection for the specified key', () => {
        init('::DECORATOR::')
  
        const collection = managed('::DECORATOR::')
  
        expect(Array.isArray(collection)).toBeTruthy()
        expect(collection?.length).toEqual(0)
  
        manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })
        
        expect(Array.isArray(collection)).toBeTruthy()
        expect(collection?.length).toEqual(1)
  
        if (collection) {
          expect(collection[0].key).toEqual('foo')
          expect(typeof collection[0].value).toBe('string')
          expect(collection[0].value).toEqual('foo')
        }
      })
    })

    describe('when item is an array', () => {
      describe('when none of the items in the passed array already exists in the collection', () => {
        it('returns true: indicating all items were added', () => {
          init('::DECORATOR::')

          const items = [
            { key: 'bar',  value: 'bar'  },
            { key: 'baz',  value: 'baz'  },
            { key: 'bang', value: 'bang' },
            { key: 'boom', value: 'boom' },
          ]

          expect(manage<string>('::DECORATOR::', items)).toBeTruthy()
          expect(managed('::DECORATOR::')?.length).toEqual(4)
        })
      })

      describe('when any of the items in the passed array already exists in the collection', () => {
        it('returns true: indicating no items were added', () => {
          init('::DECORATOR::')

          manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })
          expect(managed('::DECORATOR::')?.length).toEqual(1)

          const items = [
            { key: 'foo',  value: 'foo'  },
            { key: 'baz',  value: 'baz'  },
            { key: 'bang', value: 'bang' },
            { key: 'boom', value: 'boom' },
          ]

          expect(manage('::DECORATOR::', items)).toBeFalsy()
          expect(managed('::DECORATOR::')?.length).toEqual(1)
        })
      })
    })
  })

  describe('unmanage', () => {
    it('is a function', () =>
      expect(typeof unmanage).toBe('function')
    )

    describe('when the specified item exists in the specified collection', () => {
      it('returns true: indicating the specified item was removed from the collection', () => {
        manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })
  
        expect(unmanage('::DECORATOR::', 'foo')).toBeTruthy()
      })

      it('removes the specified item from the specified collection', () => {
        manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })
        manage<string>('::DECORATOR::', { key: 'bar', value: 'bar' })
  
        const decorators = managed('::DECORATOR::')
  
        expect(decorators?.length).toEqual(2)
  
        if (decorators) {
          expect(decorators[0].key).toEqual('foo')
          expect(decorators[0].value).toEqual('foo')
        }
  
        unmanage('::DECORATOR::', 'foo')
  
        expect(decorators?.length).toEqual(1)
  
        if (decorators) {
          expect(decorators[0].key).toEqual('bar')
          expect(decorators[0].value).toEqual('bar')
        }
      })
    })

    describe('when the specified item does not exist in the specified collection', () => {
      it('returns false', () => {
        manage<string>('::DECORATOR::', { key: 'bar', value: 'bar' })

        expect(unmanage('::DECORATOR::', 'foo')).toBeFalsy()
      })
    })
  })

  describe('managed', () => {
    it('is a function', () => expect(typeof managed).toBe('function'))

    it('returns the specified managed collection', () => {
      init('::DECORATOR::')

      manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })

      const collection = managed<string>('::DECORATOR::')

      expect(collection?.length).toEqual(1)

      if (collection) {
        expect(typeof collection[0]).toEqual('object')
        expect(typeof collection[0].key).toEqual('string')
        expect(typeof collection[0].value).toEqual('string')
        expect(collection[0].key).toEqual('foo')
        expect(collection[0].value).toEqual('foo')
      }
    })
  })

  describe('item', () => {
    it('is a function', () => expect(typeof item).toBe('function'))

    it('returns collection for the passed key', () => {
      init('::DECORATOR::')

      manage<string>('::DECORATOR::', { key: 'foo', value: 'foo' })

      expect(typeof item<string>('::DECORATOR::', 'foo')).toEqual('string')
    })

    it('returns undefined when the collection for the specified key does not exist', () => {
      expect(item<string>('::DECORATOR::', 'non-existant')).toBeUndefined()
    })
  })
})