import {
  describe,
  expect,
  it,
} from "bun:test"

import bootstrap           from "../lib/Bootstrapper"
import executeInitializers from "../lib/Bootstrapper/executeInitializers"

describe('Madul', () => {
  describe('executeInitializers', () => {
    it('is a function', () =>
      expect(typeof executeInitializers).toBe('function')
    )

    it('executes all methods starting with a $ found on a wrapped object', async () => {
      let calls = 0

      const ready = {
        /* NOTE: These methods *must* have been wrapped via MethodWrapper.wrap
                 for executeInitializers to work correctly. */
        $init: async () => Promise.resolve(calls++),
        $foo:  async () => Promise.resolve(calls++),

      }

      await executeInitializers(ready)
      
      expect(calls).toEqual(2)
    })
  })

  describe('bootstrap', () => {
    it('is a function', () =>
      expect(typeof bootstrap).toBe('function')
    )
  })
})