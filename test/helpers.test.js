import {
  describe,
  expect,
  it,
} from "bun:test"

const { executeAndReset } = require('../lib/helpers')

describe('helpers', () => {
  describe('executeAndReset', () => {
    it('is a function', () =>
      expect(typeof executeAndReset).toBe('function')
    )

    // it('executes all passed function and sets the array to undefined', () => {
    //   let   calls     = 0
    //   const inc       = () => calls++
    //   const functions = { test: [inc, inc] }

    //   executeAndReset(functions, 'test')

    //   expect(calls).toEqual(2)
    //   expect(functions.test).toBeUndefined()
    // })
  })
})