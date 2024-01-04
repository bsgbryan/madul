import {
  describe,
  expect,
  it,
} from "bun:test"

const {
  record,
  bootstrap,
} = require('../sdk/Invokation')

const { on } = require('../sdk/Events')

describe('Invokation', () => {
  describe('bootstrap', () => {
    it('is a function', () =>
      expect(typeof bootstrap).toBe('function')
    )

    it('is an async function', () =>
      expect(bootstrap.constructor.name).toEqual('AsyncFunction')
    )
  })

  describe('record', () => {
    it('is a function', () =>
      expect(typeof record).toBe('function')
    )

    it('returns an object whose properties are the lifecycle notifications', () => {
      const result = record()

      expect(typeof result).toBe('object')
      expect(typeof result.invoke).toBe('function')
      expect(typeof result.complete).toBe('function')
      expect(typeof result.fail).toBe('function')
      expect(typeof result.update).toBe('function')
    })
  })

  describe('invoke', () => {
    it('is a function', () =>
      expect(typeof record().invoke).toBe('function')
    )

    it('calls the Events.emit.call function', done => {
      on.call('/example', 'baz', () => done())

      record().invoke('/example', 'baz')
    })
  })

  describe('complete', () => {
    it('is a function', () =>
      expect(typeof record().complete).toBe('function')
    )

    it('calls the Events.emit.done function', done => {
      on.done('/example', 'baz', () => done())

      record().complete('/example', 'baz')
    })
  })

  describe('fail', () => {
    it('is a function', () =>
      expect(typeof record().fail).toBe('function')
    )

    it('calls the Events.emit.error function', done => {
      on.error('/example', 'baz', () => done())

      record().fail('/example', 'baz')
    })
  })

  describe('update', () => {
    it('is a function', () =>
      expect(typeof record().update).toBe('function')
    )

    it('calls the Events.emit.progress function', done => {
      on.progress('/example', 'baz', () => done())

      record().update('/example', 'baz')
    })
  })
})