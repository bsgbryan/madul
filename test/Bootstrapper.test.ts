import {
  describe,
  expect,
  it,
} from "bun:test"

import Bootstrap           from "@/Bootstrapper"
import executeInitializers from "@/Bootstrapper/executeInitializers"

import { Madul } from "@/types"

describe('Bootstrapper', () => {
  // describe('executeInitializers', () => {
  //   it('is a function', () =>
  //     expect(typeof executeInitializers).toBe('function')
  //   )

  //   it('executes all methods starting with a $ found on a wrapped object', async () => {
  //     let calls = 0

  //     const ready = {
  //       /* NOTE: These methods *must* have been wrapped via MethodWrapper.wrap
  //                for executeInitializers to work correctly. */
  //       $init: async () => Promise.resolve(calls++),
  //       $foo:  async () => Promise.resolve(calls++),
  //     } as unknown as Madul

  //     await executeInitializers(ready)
      
  //     expect(calls).toEqual(2)
  //   })
  // })

  describe('Bootstrap', () => {
    it('is a function', () =>
      expect(typeof Bootstrap).toBe('function')
    )

    it('bootstraps stuff', async () => {
      const foo = await Bootstrap('+/Foo')

      console.log(foo)
    })
  })
})