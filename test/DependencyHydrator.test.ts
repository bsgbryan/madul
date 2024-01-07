import {
  describe,
  expect,
  it,
} from "bun:test"

import load    from "../lib/Loader"
import hydrate from "../lib/DependencyHydrator"

describe('DependencyHydrator', () => {
  describe('hydrate', () => {
    it('is a function', () =>
      expect(typeof hydrate).toBe('function')
    )

    it('is an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(hydrate).constructor

      expect(fn.name).toEqual('AsyncFunction')
    })

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(hydrate([])).constructor

      expect(fn.name).toEqual('Promise')
    })

    it('returns the hydrated dependencies as an object when the Promise resolves', async () => {
      const output = await hydrate(['async'])

      expect(Object.keys(output).length).toEqual(1)
      expect(Object.keys(output)[0]).toEqual('async')
      expect(typeof output.async).toBe('object')
      expect(typeof output.async.each).toBe('function')
    })

    describe('when functions are specified', () => {
      it('adds each specified function to the output object directly', async () => {
        const output = await hydrate(['async[each]'])

        expect(Object.keys(output).length).toEqual(1)
        expect(Object.keys(output)[0]).toEqual('each')
        expect(typeof output.each).toBe('function')
      })

      it('does *not* add the root dependency to the output object', async () => {
        const output = await hydrate(['async[each]'])

        expect(output.async).toBeUndefined()
      })
    })

    it('returns the madul with all deps ready to go', async () => {
      const loaded   = await load('/hasDeps', { root: process.cwd() })
      const hydrated = await hydrate(loaded.deps)

      expect(typeof hydrated.exampleDep).toBe('object')
      expect(typeof hydrated.exampleDep.foo).toBe('function')
      expect(typeof hydrated.exampleDep.bar).toBe('function')
      expect(typeof hydrated.exampleDep.baz).toBe('function')
      expect(typeof hydrated.exampleDep.bang).toBe('function')

      expect(typeof hydrated.anotherExampleDep).toBe('object')
      expect(typeof hydrated.anotherExampleDep.biff).toBe('function')
      expect(typeof hydrated.anotherExampleDep.buzz).toBe('function')
      expect(typeof hydrated.anotherExampleDep.boom).toBe('function')
      expect(typeof hydrated.anotherExampleDep.boff).toBe('function')
    })
  })
})