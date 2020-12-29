const { expect } = require('chai')

const {
  wrap,
  doWrap,
  validate
} = require('../lib/MethodWrapper')

const foo = { bar: function() { } }

describe('MethodWrapper', () => {
  describe('wrap', () => {
    it('is a function', () =>
      expect(wrap).to.be.a('function')
    )

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(wrap('test', foo)).constructor

      expect(fn.name).to.equal('Promise')
    })

    it('wraps all methods on an object', async () => {
      const test = {
        $init: function({ done, progress }) {
          expect(done).to.be.a('function')
          expect(progress).to.be.a('function')

          done()
        },
        foo: function({ testParam, done, progress }) {
          expect(testParam).to.equal('bar')
          expect(done).to.be.a('function')
          expect(progress).to.be.a('function')

          done()
        }
      }

      const wrapped = await wrap('test', test)

      await wrapped.$init()
      await wrapped.foo({ testParam: 'bar' })
    })

    it('does not wrap properties that are not functions', async () => {
      const test = {
        ...foo,
        $init: false,
        baz:   4,
      }

      const wrapped = await wrap('test', test)

      expect(wrapped.baz).to.equal(4)
      expect(wrapped.$init).to.be.false
    })

    it('returns a frozen object', async () => {
      const test = {
        $init: function() { },
        foo:   function() { }
      }

      const wrapped = await wrap('test', test)

      expect(Object.isFrozen(wrapped)).to.be.true
    })

    it('does not wrap methods if they are deps', async () => {
      const test = {
        deps: ['BAR -> bar'],
        bar:  function() { return 'Not wrapped' },
      }

      const wrapped = await wrap('test', test)

      expect(wrapped.bar()).to.equal('Not wrapped')
    })
  })

  describe('doWrap', () => {
    it('is a function', () =>
      expect(doWrap).to.be.a('function')
    )

    it('returns an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(doWrap('test', )).constructor

      expect(fn.name).to.equal('AsyncFunction')
    })

    it('returns a Promise from the returned AsyncFunction', () => {
      const fn = Object.getPrototypeOf(doWrap('test', )()).constructor

      expect(fn.name).to.equal('Promise')
    })

    it('invokes the specified property, using the passed output as "this"', async () => {
      const output   = { foo: 4 }
      const instance = { bar: function({ done }) { done(this.foo) } }
      const wrapped  = doWrap('test', instance, 'bar', output)
      const result   = await wrapped()

      expect(result).to.equal(output.foo)
    })

    it('passes params through to the wrapped function', async () => {
      const output   = { }
      const instance = { bar: ({ example, done }) => done(example) }
      const wrapped  = doWrap('test', instance, 'bar', output)
      const result   = await wrapped({ example: 'param' })

      expect(result).to.equal('param')
    })

    it('rejects the Promise when the wrapped function throws an error', async () => {
      const output   = { }
      const instance = { bar: () => { throw new Error('BOOM') } }
      const wrapped  = doWrap('test', instance, 'bar', output)

      try {
        await wrapped()
      } catch (e) {
        expect(e.message).to.equal('BOOM')
      }
    })

    it('resolves the Promise when done is called', async () => {
      const output   = { }
      const instance = { bar: ({ done }) => done('whew!') }
      const wrapped  = doWrap('test', instance, 'bar', output)
      const result   = await wrapped()

      expect(result).to.equal('whew!')
    })
  })

  describe('validate', () => {
    it('is a function', () =>
      expect(validate).to.be.a('function')
    )

    it('throws an error if passed an array', () => {
      try {
        validate([])
      } catch (e) {
        expect(e.message).to.equal('An array cannot be wrapped')
      }
    })

    it('throws an error if passed a string', () => {
      try {
        validate('foo')
      } catch (e) {
        expect(e.message).to.equal('string is not a valid type')
      }
    })

    it('throws an error if passed a number', () => {
      try {
        validate(4)
      } catch (e) {
        expect(e.message).to.equal('number is not a valid type')
      }
    })

    it('throws an error if passed a boolean', () => {
      try {
        validate(false)
      } catch (e) {
        expect(e.message).to.equal('boolean is not a valid type')
      }
    })

    it('throws an error if passed null', () => {
      try {
        validate(null)
      } catch (e) {
        expect(e.message).to.equal('Cannot wrap null')
      }
    })

    it('throws an error if passed undefined', () => {
      try {
        validate()
      } catch (e) {
        expect(e.message).to.equal('Cannot wrap undefined')
      }
    })

    it('throws an error if there are no functions to wrap', () => {
      try {
        validate({})
      } catch (e) {
        expect(e.message).to.equal('instance must contain at least one functional property')
      }
    })
  })
})