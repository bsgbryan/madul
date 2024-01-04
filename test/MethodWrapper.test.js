import {
  describe,
  expect,
  it,
  afterEach,
} from "bun:test"

const {
  init,
  resetAll,
} = require('../lib/DecoratorManager')

const {
  wrap,
  doWrap,
  validate
} = require('../lib/MethodWrapper')

/*
  IMPORTANT: We *must* initialize the decorators collection
             for /test before the tests, otherwise we'll get
             a bunch of errors.
 */
init('/test')

describe('MethodWrapper', () => {
  afterEach(resetAll)

  describe('wrap', () => {
    it('is a function', () =>
      expect(typeof wrap).toBe('function')
    )

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(wrap('test', { foo: () => {} })).constructor

      expect(fn.name).toEqual('Promise')
    })

    it('wraps all methods on an object', async () => {
      const test = {
        foo: function({ testParam, done, progress }) {
          expect(testParam).toEqual('bar')
          expect(typeof done).toBe('function')
          expect(typeof progress).toBe('function')

          done()
        }
      }

      const wrapped = await wrap('/test', test)

      expect(Object.keys(test).length).toEqual(1)
      expect(Object.keys(wrapped).length).toEqual(1)

      // Prove wrapped function is async
      await wrapped.foo({ testParam: 'bar' })
    })

    it('does not wrap properties that are not functions', async () => {
      const test = {
        $init: false,
        foo: ({ done }) => done(),
        baz:   4,
      }

      const wrapped = await wrap('/test', test)

      expect(wrapped.baz).toBeUndefined()
      expect(wrapped.$init).toBeUndefined()
    })

    it('returns a frozen object', async () => {
      const test = {
        foo: function() { }
      }

      const wrapped = await wrap('/test', test)

      expect(Object.isFrozen(wrapped)).toBeTruthy()
    })

    it('does not wrap methods if they are deps', async () => {
      const test = {
        deps: ['BAR -> bar'],
        bar:  function() { return 'Not wrapped' },
      }

      const wrapped = await wrap('/test', test)

      expect(wrapped.bar).toBeUndefined()
    })
  })

  describe('doWrap', () => {
    it('is a function', () =>
      expect(typeof doWrap).toBe('function')
    )

    it('returns an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(doWrap('/test')).constructor

      expect(fn.name).toEqual('AsyncFunction')
    })

    it('returns a Promise from the returned AsyncFunction', () => {
      const delegate = doWrap('/test', { foo: () => {} }, 'foo')
      const fn = Object.getPrototypeOf(delegate()).constructor

      expect(fn.name).toEqual('Promise')
    })

    it('invokes the specified property, using the passed self as the self param', async () => {
      const self     = { foo: 4 }
      const instance = { bar: function({ self, done }) { done(self.foo) } }
      const wrapped  = doWrap('/test', instance, 'bar', self)
      const result   = await wrapped()

      expect(result).toEqual(self.foo)
    })

    it('passes params through to the wrapped function', async () => {
      const self     = { }
      const instance = { bar: ({ example, done }) => done(example) }
      const wrapped  = doWrap('/test', instance, 'bar', self)
      const result   = await wrapped({ example: 'param' })

      expect(result).toEqual('param')
    })

    it('rejects the Promise when the wrapped function throws an error', async () => {
      const self     = { }
      const instance = { bar: () => { throw new Error('BOOM') } }
      const wrapped  = doWrap('/test', instance, 'bar', self)

      try {
        await wrapped()
      } catch (e) {
        expect(e.message).toEqual('BOOM')
      }
    })

    it('resolves the Promise when done is called', async () => {
      const self     = { }
      const instance = { bar: ({ done }) => done('whew!') }
      const wrapped  = doWrap('/test', instance, 'bar', self)
      const result   = await wrapped()

      expect(result).toEqual('whew!')
    })
  })

  describe('validate', () => {
    it('is a function', () =>
      expect(typeof validate).toBe('function')
    )

    it('throws an error if passed an array', () => {
      try {
        validate([])
      } catch (e) {
        expect(e.message).toEqual('An array cannot be wrapped')
      }
    })

    it('throws an error if passed a string', () => {
      try {
        validate('foo')
      } catch (e) {
        expect(e.message).toEqual('string is not a valid type')
      }
    })

    it('throws an error if passed a number', () => {
      try {
        validate(4)
      } catch (e) {
        expect(e.message).toEqual('number is not a valid type')
      }
    })

    it('throws an error if passed a boolean', () => {
      try {
        validate(false)
      } catch (e) {
        expect(e.message).toEqual('boolean is not a valid type')
      }
    })

    it('throws an error if passed null', () => {
      try {
        validate(null)
      } catch (e) {
        expect(e.message).toEqual('Cannot wrap null')
      }
    })

    it('throws an error if passed undefined', () => {
      try {
        validate()
      } catch (e) {
        expect(e.message).toEqual('Cannot wrap undefined')
      }
    })

    it('throws an error if there are no functions to wrap', () => {
      try {
        validate({})
      } catch (e) {
        expect(e.message).toEqual('instance must contain at least one functional property')
      }
    })
  })
})