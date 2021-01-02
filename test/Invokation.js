const { expect } = require('chai')

const { record } = require('../sdk/Invokation')

const { on } = require('../sdk/Events')

describe('Invokation', () => {
  describe('invoke', () => {
    it('is a function', () =>
      expect(record().invoke).to.be.a('function')
    )

    it('calls the Events.emit.call function', done => {
      on.call('/example', 'baz', () => done())

      record().invoke('/example', 'baz')
    })
  })

  describe('complete', () => {
    it('is a function', () =>
      expect(record().complete).to.be.a('function')
    )

    it('calls the Events.emit.done function', done => {
      on.done('/example', 'baz', () => done())

      record().complete('/example', 'baz')
    })
  })

  describe('fail', () => {
    it('is a function', () =>
      expect(record().fail).to.be.a('function')
    )

    it('calls the Events.emit.error function', done => {
      on.error('/example', 'baz', () => done())

      record().fail('/example', 'baz')
    })
  })

  describe('update', () => {
    it('is a function', () =>
      expect(record().update).to.be.a('function')
    )

    it('calls the Events.emit.progress function', done => {
      on.progress('/example', 'baz', () => done())

      record().update('/example', 'baz')
    })
  })
})