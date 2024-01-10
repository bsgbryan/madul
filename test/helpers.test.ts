import {
  describe,
  expect,
  it,
} from "bun:test"

import { executeAndReset } from "../lib/helpers"

describe('helpers', () => {
  describe('executeAndReset', () => {
    it('is a function', () =>
      expect(typeof executeAndReset).toBe('function')
    )
    
    // TODO Add more tests
  })
})