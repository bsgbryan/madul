import {
  describe,
  expect,
  it,
} from "bun:test"

const testable = require('../lib/Testable')

describe('Testable', () => {
  it('is a function', () => expect(typeof testable).toBe('function'))

  it('returns the madul, unwrapped', async () => {
    const result = await testable('/example')

    expect(typeof result).toBe('object')
    expect(typeof result.baz).toBe('function')
    expect(Array.isArray(result.deps)).toBeTruthy()
    expect(result.deps[0]).toEqual('/test')
  })
})