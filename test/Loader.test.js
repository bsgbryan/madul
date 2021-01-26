const { expect } = require('chai')

const { tmpdir } = require('os')

const { stat } = require('fs').promises

const { assign } = require('../lib/SDKMapping')

const   load    = require('../lib/Loader')
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
      expect(load).to.be.a('function')
    )

    it("wraps a madul's source in a function call that passes all sdk functions", async () => {
      assign('/example', { test: () => 'OHAI' })

      const madul = await load('/example', { root: process.cwd() })

      madul.baz({
        done: sdk => {
          expect(sdk).to.be.an('object')
          expect(sdk.test).to.be.a('function')
          expect(sdk.test()).to.equal('OHAI')
        }
      })
    })

    it('properly loads core node modules', async () => {
      const loaded = await load('os')

      expect(loaded).to.be.an('object')
      expect(loaded.cpus).to.be.a('function')
      expect(Array.isArray(loaded.cpus())).to.be.true
    })

    it('properly loads modules from node_modules', async() => {
      const loaded = await load('async')

      expect(loaded).to.be.an('object')
      expect(loaded.each).to.be.a('function')
    })

    it('throws an error for moduels that cannot be loaded', async () => {
      try { await load('bad', { root: process.cwd() }) }
      catch (e) { expect(e.code).to.equal('ENOENT')}
    })
  })

  describe('tmpFile', () => {
    it('is a function', () =>
      expect(tmpFile).to.be.a('function')
    )

    it('returns the path to the created tmp file', async () => {
      const path = `${tmpdir()}/madul/scratch/example.js`

      expect(await tmpFile('example', process.cwd())).to.equal(path)
    })
  })

  describe('tmpFile.wrap', () => {
    it('is a function', () =>
      expect(tmpFile.wrap).to.be.a('function')
    )

    it('retruns the argument passed wrapped with the code used to pass the sdk to maduls', () => {
      expect(tmpFile.wrap('const madul = {}')).to.equal(wrapped)
    })
  })

  describe('tmpFile.createTmpFileOnlyIfItDoesntExist', async () => {
    const loadFile = `${tmpdir()}/test.js`
    const loadPath = tmpdir()
    const wrapped = 'const test = () => "OHAI"'

    console.log(tmpdir())
    await tmpFile.createTmpFileOnlyIfItDoesntExist(loadFile, loadPath, wrapped)

    const s = await stat(loadFile)

    expect(s.isFile()).to.be.true
  })
})