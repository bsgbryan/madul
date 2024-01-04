import {
  describe,
  expect,
  it,
} from "bun:test"

const { tmpdir } = require('os')

const { stat } = require('fs').promises

const { assign } = require('../lib/SDKMapping')

const  load     = require('../lib/Loader')
const  tmpFile  = require('../lib/Loader/tmpFile')

const wrapped = `
module.exports = sdk => {

const madul = {}

return madul

}
`

describe('Loader', () => {
  describe('load', () => {
    it('is a function', () =>
      expect(typeof load).toBe('function')
    )

    it("wraps a madul's source in a function call that passes all sdk functions", async () => {
      assign('/example', { test: () => 'OHAI' })

      const madul = await load('/example', { root: process.cwd() })

      madul.baz({
        done: sdk => {
          expect(typeof sdk).toBe('object')
          expect(typeof sdk.test).toBe('function')
          expect(sdk.test()).toEqual('OHAI')
        }
      })
    })

    it('properly loads core node modules', async () => {
      const loaded = await load('os')

      expect(typeof loaded).toBe('object')
      expect(typeof loaded.cpus).toBe('function')
      expect(Array.isArray(loaded.cpus())).toBeTruthy()
    })

    it('properly loads modules from node_modules', async() => {
      const loaded = await load('async')

      expect(typeof loaded).toBe('object')
      expect(typeof loaded.each).toBe('function')
    })

    it('throws an error for moduels that cannot be loaded', async () => {
      try { await load('bad', { root: process.cwd() }) }
      catch (e) { expect(e.code).toEqual('ENOENT')}
    })
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

  describe('tmpFile.wrap', () => {
    it('is a function', () =>
      expect(typeof tmpFile.wrap).toBe('function')
    )

    it('retruns the argument passed wrapped with the code used to pass the sdk to maduls', () => {
      expect(tmpFile.wrap('const madul = {}')).toEqual(wrapped)
    })
  })

  describe('tmpFile.createTmpFileOnlyIfItDoesntExist', async () => {
    it("creates a tmp file when it doesn't exist", async () => {
      const loadFile = `${tmpdir()}/test.js`
      const loadPath = tmpdir()
      const wrapped = 'const test = () => "OHAI"'
  
      await tmpFile.createTmpFileOnlyIfItDoesntExist(loadFile, loadPath, wrapped)
  
      const s = await stat(loadFile)
  
      expect(s.isFile()).toBeTruthy()
    })
  })
})