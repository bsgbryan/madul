import {
  describe,
  expect,
  it,
} from "bun:test"

import {
  manage,
  managed,
} from "#Collection"

import {
  Mode,
  ParameterSet,
} from "#types"

import Execute, {
  add,
  remove,
  scope,
} from "#Decorator"

describe('DecoratorManager', () => {
  const test = () => {}
  test._wrapped = 'test'

  describe('add', () => {
    it('is a function', () => expect(typeof add).toEqual('function'))

    it('adds a decorator for the specified madul spec', () => {
      add('test', 'fun', Mode.before, test)

      const decorator = managed<CallableFunction>(scope('test', 'fun', Mode.before))

      expect(decorator!.length).toEqual(1)
      expect(decorator![0].key).toEqual('test')
      expect(decorator![0].value).toEqual(test)
    })
  })

  describe('remove', () => {
    it('is a function', () => expect(typeof remove).toEqual('function'))

    it('removes the specified decorator for the specified spec', () => {
      add('test', 'fun', Mode.before, test)

      const decorator = managed<CallableFunction>(scope('test', 'fun', Mode.before))

      expect(decorator?.length).toEqual(1)

      remove('test', 'fun', Mode.before, 'test')

      if (decorator) expect(decorator.length).toEqual(0)
    })
  })

  describe('Execute', () => {
    it('is a function', () => expect(typeof Execute).toBe('function'))

    it('execute all decorators for a madul when any member is invoked', async () => {
      let ran = false,
          args: ParameterSet

      manage<CallableFunction>(scope('test', 'fun', Mode.before), {
        key: 'fun',
        value: (params: ParameterSet) => {
          args = params
          ran  = true
        }
      })

      await Execute('test', 'fun', Mode.before)

      expect(ran).toBeTruthy()
      expect(args!).toEqual({
        spec: 'test',
        fun:  'fun',
        input: undefined,
      })
    })
  })
})