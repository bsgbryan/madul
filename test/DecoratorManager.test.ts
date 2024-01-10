import {
  describe,
  expect,
  it,
} from "bun:test"

import Bootstrap from "../lib/Bootstrapper"

import DecoratorManager from "../lib/DecoratorManager"

describe('DecoratorManager', () => {
  describe('execute', () => {
    it('is a function', () =>
      expect(typeof DecoratorManager).toBe('function')
    )

    it('execute all decorators for a madul when any member is invoked', async () => {
      const test   = await Bootstrap('/test')
      const before = await Bootstrap('/testBefore')
      const after  = await Bootstrap('/testAfter')

      await test.foo()

      const beforeRan = await before.didRun()
      const afterRan  = await after.didRun()

      expect(beforeRan).toBeTruthy()
      expect(afterRan).toBeTruthy()
    })
  })
})