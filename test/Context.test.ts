import {
  describe,
  expect,
  it,
} from "bun:test"

import { typed } from "#Context"

describe('Context', () => {
  describe('typed' , () => {
    it('handles an integer properly', () => {
      expect(typed(42)).toEqual('\u001B[95m42\u001B[39m')
    })

    it('handles a float properly', () => {
      expect(typed(3.14)).toEqual('\u001B[95m3.14\u001B[39m')
    })

    it('handles a string properly', () => {
      expect(typed('o, hai')).toEqual('\u001B[37mo, hai\u001B[39m')
    })

    it('handles a boolean properly', () => {
      expect(typed(false)).toEqual('\u001B[94mfalse\u001B[39m')
    })

    it('handles null properly', () => {
      expect(typed(null)).toEqual('\u001B[94mnull\u001B[39m')
    })

    it('handles undefined properly', () => {
      expect(typed(undefined)).toEqual('\u001B[94mundefined\u001B[39m')
    })

    it('handles an async WrappedFunction properly', () => {
      const cool = async () => {}

      cool._wrapped = 'cool'

      expect(typed(cool)).toEqual('\u001B[36m[\u001B[39m\u001B[96mAsyncFunction\u001B[39m\u001B[2m:\u001B[22m\u001B[1m\u001B[96mcool\u001B[39m\u001B[22m\u001B[36m]\u001B[39m')
    })

    it('handles an async function properly', () => {
      expect(typed(async () => {})).toEqual('\u001B[36m[AsyncFunction]\u001B[39m')
    })

    it('handles a WrappedFunction properly', () => {
      const cool = () => {}

      cool._wrapped = 'cool'

      expect(typed(cool)).toEqual('\u001B[36m[\u001B[39m\u001B[96mFunction\u001B[39m\u001B[2m:\u001B[22m\u001B[1m\u001B[96mcool\u001B[39m\u001B[22m\u001B[36m]\u001B[39m')
    })

    it('handles a function properly', () => {
      expect(typed(() => {})).toEqual('\u001B[36m[Function]\u001B[39m')
    })

    it('handles an instance of a class properly', () => {
      class Cool {}
      const cool = new Cool()

      expect(typed(cool)).toEqual('\u001B[32mCool\u001B[39m')
    })

    describe('handling of arrays', () => {
      it('does not truncate when an array has five items', () => {
        const names = ['alpha', 'beta', 'gamma', 'delta', 'theta']

        expect(typed(names)).toEqual('\u001B[32mArray\u001B[39m\n   \u001B[90m0\u001B[39m\u001B[2m:\u001B[22m \u001B[37malpha\u001B[39m\n   \u001B[90m1\u001B[39m\u001B[2m:\u001B[22m \u001B[37mbeta\u001B[39m\n   \u001B[90m2\u001B[39m\u001B[2m:\u001B[22m \u001B[37mgamma\u001B[39m\n   \u001B[90m3\u001B[39m\u001B[2m:\u001B[22m \u001B[37mdelta\u001B[39m\n   \u001B[90m4\u001B[39m\u001B[2m:\u001B[22m \u001B[37mtheta\u001B[39m')
      })

      it('truncates an array with more than five items', () => {
        const names = [
          'alpha', 'beta', 'gamma', 'delta', 'theta',
          'alpha', 'beta', 'gamma', 'delta', 'theta',
          'alpha', 'beta', 'gamma', 'delta', 'theta',
          'alpha', 'beta', 'gamma', 'delta', 'theta',
        ]

        expect(typed(names)).toEqual('\u001B[32mArray\u001B[39m\n   \u001B[90m 0\u001B[39m\u001B[2m:\u001B[22m \u001B[37malpha\u001B[39m\n   \u001B[90m 1\u001B[39m\u001B[2m:\u001B[22m \u001B[37mbeta\u001B[39m\n   \u001B[2m    ...\u001B[22m\n   \u001B[90m18\u001B[39m\u001B[2m:\u001B[22m \u001B[37mdelta\u001B[39m\n   \u001B[90m19\u001B[39m\u001B[2m:\u001B[22m \u001B[37mtheta\u001B[39m')
      })
    })

    it('handles an object literal properly', () => {
      const cool = {
        foo: 'bar',
        baz:  42,
        boom: false,
      }

      expect(typed(cool)).toEqual('\u001B[32mobject literal\u001B[39m\n   \u001B[37mfoo\u001B[39m\u001B[2m:\u001B[22m \u001B[37mbar\u001B[39m\n   \u001B[37mbaz\u001B[39m\u001B[2m:\u001B[22m \u001B[95m42\u001B[39m\n   \u001B[37mboom\u001B[39m\u001B[2m:\u001B[22m \u001B[94mfalse\u001B[39m')
    })
  })
})