import {
  describe,
  expect,
  it,
} from "bun:test"

import {
  find,
  recurse,
  fromCWD,
  fromNodeModules,
} from "../lib/SourceLocator"

describe('SourceLocator', () => {
  describe('fromNodeModules', () => {
    it('is a function', () =>
      expect(typeof fromNodeModules).toBe('function')
    )

    it('returns the path to the main source for a node module', async () => {
      const cwd  = process.cwd()
      const path = `${cwd}/node_modules/async/dist/async.js`

      expect(await fromNodeModules('async', cwd)).toEqual(path)
    })
  })

  describe('find', () => {
    it('is a function', () =>
      expect(typeof find).toBe('function')
    )

    it('returns the path to the passed ref if one of found', async () => {
      const found = await find(`${process.cwd()}/scratch`, 'example')
      
      expect(found).toEqual(`${process.cwd()}/scratch/example.js`)
    })

    it('returns undefined when no match for the passed ref is found', async () => {
      const found = await find(`${process.cwd()}/lib`, 'example')
      
      expect(found).toBeUndefined()
    })
  })

  describe('recurse', () => {
    it('is a function', () =>
      expect(typeof recurse).toBe('function')
    )

    it('returns an array of directories to search beneath the passed path', async () => {
      const dirs = await recurse(process.cwd())

      expect(dirs.length).toEqual(3)
      expect(dirs[0]).toEqual(`${process.cwd()}/lib`)
      expect(dirs[1]).toEqual(`${process.cwd()}/scratch`)
    })
  })

  describe('fromCWD', () => {
    it('is a function', () =>
      expect(typeof fromCWD).toBe('function')
    )

    it('returns the path the the file passed as ref', async () => {
      const path = await fromCWD('example', process.cwd())

      expect(path).toEqual(`${process.cwd()}/scratch/example.js`)
    })
  })
})