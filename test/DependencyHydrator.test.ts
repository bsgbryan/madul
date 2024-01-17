import {
  describe,
  expect,
  it,
} from "bun:test"

import DependencyHydrator from "../lib/DependencyHydrator"

describe('DependencyHydrator', () => {
  describe('hydrate', () => {
    it('is a function', () =>
      expect(typeof DependencyHydrator).toBe('function')
    )

    it('is an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(DependencyHydrator).constructor

      expect(fn.name).toEqual('AsyncFunction')
    })

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(DependencyHydrator([], () => {})).constructor

      expect(fn.name).toEqual('Promise')
    })

    it('returns the hydrated dependencies as an object when the Promise resolves', async () => {
      const output = await DependencyHydrator(
        ['async'],
        () => Promise.resolve({}),
      )

      expect(Object.keys(output).length).toEqual(1)
      expect(Object.keys(output)[0]).toEqual('async')
      expect(typeof output.async).toBe('object')
    })

    describe('when functions are specified', () => {
      it('adds each specified function to the output object directly', async () => {
        const output = await DependencyHydrator(
          ['async[each]'],
          () => Promise.resolve({ each: () => {}}),
        )

        expect(Object.keys(output).length).toEqual(1)
        expect(Object.keys(output)[0]).toEqual('each')
        expect(typeof output.each).toBe('function')
      })

      it('does *not* add the root dependency to the output object', async () => {
        const output = await DependencyHydrator(
          ['async[each]'],
          () => Promise.resolve({ each: () => {}}),
        )

        expect(output.async).toBeUndefined()
      })
    })
  })
})