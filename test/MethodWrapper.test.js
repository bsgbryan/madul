const { expect } = require('chai')

const {
  wrap,
  doWrap
} = require('../lib/MethodWrapper')

const foo = { bar: () => { } }

describe.only('MethodWrapper', () => {
  describe('wrap', () => {
    it('is a function', () =>
      expect(wrap).to.be.a('function')
    )

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(wrap(foo)).constructor

      expect(fn.name).to.equal('Promise')
    })

    it('wraps all methods on an object', async () => {
      const test = {
        $init: ({ done, fail }) => {
          expect(done).to.be.a('function')
          expect(fail).to.be.a('function')

          done()
        },
        foo: ({ testParam, done, fail }) => {
          expect(testParam).to.equal('bar')
          expect(done).to.be.a('function')
          expect(fail).to.be.a('function')

          done()
        }
      }

      const wrapped = await wrap(test)

      await wrapped.$init()
      await wrapped.foo({ testParam: 'bar' })
    })

    it('does not wrap properties that are not functions', async () => {
      const test = {
        ...foo,
        $init: false,
        baz:   4,
      }

      const wrapped = await wrap(test)

      expect(wrapped.baz).to.equal(4)
      expect(wrapped.$init).to.be.false
    })

    it('returns a frozen object', async () => {
      const test = {
        $init: () => {},
        foo: () => {}
      }

      const wrapped = await wrap(test)

      expect(Object.isFrozen(wrapped)).to.be.true
    })

    it('does not wrap methods if they are deps', async () => {
      const test = {
        deps: ['BAR -> bar'],
        bar: () => 'Not wrapped',
      }

      const wrapped = await wrap(test)

      expect(wrapped.bar()).to.equal('Not wrapped')
    })
  })

  describe('doWrap', () => {
    it('is a function', () =>
      expect(doWrap).to.be.a('function')
    )

    it('returns an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(doWrap()).constructor

      expect(fn.name).to.equal('AsyncFunction')
    })
  })
})