import {
  describe,
  expect,
  it,
} from "bun:test"

import { tmpdir } from "os"

import { stat } from "node:fs/promises"

import { assign } from "../lib/SDKMapping"

import Loader from "../lib/Loader"

import tmpFile, {
  createTmpFileOnlyIfItDoesntExist,
  wrap,
} from "../lib/Loader/tmpFile"

const wrapped = `
module.exports = sdk => {

const madul = {}

return madul

}
`

describe('Loader', () => {
  it('is a function', () =>
    expect(typeof Loader).toBe('function')
  )

  it("wraps a madul's source in a function call that passes all sdk functions", async () => {
    assign('/example', { test: () => 'OHAI' })

    const madul = await Loader('/example', { root: process.cwd() })

    madul.baz({
      done: sdk => {
        expect(typeof sdk).toBe('object')
        expect(typeof sdk.test).toBe('function')
        expect(sdk.test()).toEqual('OHAI')
      }
    })
  })

  it('properly loads core node modules', async () => {
    const loaded = await Loader('os')

    expect(typeof loaded).toBe('object')
    expect(typeof loaded.cpus).toBe('function')
    expect(Array.isArray(loaded.cpus())).toBeTruthy()
  })

  it('properly loads modules from node_modules', async() => {
    const loaded = await Loader('async')

    expect(typeof loaded).toBe('object')
    expect(typeof loaded.each).toBe('function')
  })

  it('throws an error for moduels that cannot be loaded', async () => {
    try { await Loader('bad', { root: process.cwd() }) }
    catch (e) { expect(e.message).toEqual('bad could not be found in /Users/rinzler/Code/madul')}
  })

  describe('tmpFile', () => {
    it('is a function', () =>
      expect(typeof tmpFile).toBe('function')
    )

    it('returns the path to the created tmp file', async () => {
      const path = `${process.cwd()}/.maduls/scratch/example.js`

      expect(await tmpFile('example', process.cwd())).toEqual(path)
    })
  })

  describe('wrap', () => {
    it('is a function', () =>
      expect(typeof wrap).toBe('function')
    )

    it('retruns the argument passed wrapped with the code used to pass the sdk to maduls', () => {
      expect(wrap('const madul = {}')).toEqual(wrapped)
    })
  })

  describe('createTmpFileOnlyIfItDoesntExist', async () => {
    it("creates a tmp file when it doesn't exist", async () => {
      const loadFile = `${tmpdir()}/test.js`
      const loadPath = tmpdir()
      const wrapped = 'const test = () => "OHAI"'
  
      await createTmpFileOnlyIfItDoesntExist(loadFile, loadPath, wrapped)
  
      const s = await stat(loadFile)
  
      expect(s.isFile()).toBeTruthy()
    })
  })
})