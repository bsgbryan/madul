import {
  describe,
  expect,
  it,
} from "bun:test"

import Bootstrap, { Path } from "@/Bootstrap"

describe('path', () => {
  it('builds a path from the spec and compilerOptions.paths', async () => {
    const result = await Path('+/Foo')

    expect(result).toEqual(`${process.cwd()}/scratch/Foo`)
  })
})

describe('Bootstrapper', () => {
  describe('Bootstrap', () => {
    it('is a function', () =>
      expect(typeof Bootstrap).toBe('function')
    )

    it('bootstraps stuff', async () => {
      const foo = await Bootstrap('+/Foo')

      expect(foo).toBeDefined()
      expect(foo.boom).toBeDefined()

      expect(foo.ohai({ person: 'Bob' })).toEqual('OHAI, Bob! ... Ba Da Boom')
    })
  })
})