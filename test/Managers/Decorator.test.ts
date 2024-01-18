import {
  describe,
  expect,
  it,
} from "bun:test"

import {
  init,
  manage,
  managed,
} from "@/Managers/Collection"

import {
  Madul,
  ParameterSet,
} from "@/types"

import Execute, {
  add, remove,
} from "@/Managers/Decorator"

describe('DecoratorManager', () => {
  describe('add', () => {
    it('is a function', () =>
      expect(typeof add).toEqual('function')
    )

    it('adds a decorator for the specified madul spec', () => {
      add('/test', { name: 'Test' })

      const decorator = managed<Madul>('/test::DECORATORS')

      expect(decorator?.length).toEqual(1)

      if (decorator) {
        expect(decorator[0].key).toEqual('Test')
        expect(decorator[0].value).toEqual({ name: 'Test' })
      }
    })
  })

  describe('remove', () => {
    it('is a function', () =>
      expect(typeof remove).toEqual('function')
    )

    it('removes the specified decorator for the specified spec', () => {
      add('/test', { name: 'Test' })

      const decorator = managed<Madul>('/test::DECORATORS')

      expect(decorator?.length).toEqual(1)

      remove('/test', 'Test')

      if (decorator) expect(decorator.length).toEqual(0)
    })
  })

  describe('Execute', () => {
    it('is a function', () =>
      expect(typeof Execute).toBe('function')
    )

    it('execute all decorators for a madul when any member is invoked', async () => {
      init('/test::DECORATORS')

      let ran = false,
          args: ParameterSet

      manage<Madul>('/test::DECORATORS', {
        key: "doesn't matter",
        value: {
          name: 'Test',
          before: (params: ParameterSet) => {
            args = params
            ran  = true
          }
        } as Madul
      })

      await Execute('/test', 'test', 'before')

      expect(ran).toBeTruthy()
      // @ts-ignore TS thinks this is being used before it's defined; it's not
      expect(args).toEqual({
        spec:   '/test',
        method: 'test',
        params:  undefined,
      })
    })
  })
})