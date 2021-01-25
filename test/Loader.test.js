const { expect } = require('chai')

const { tmpdir } = require('os')

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
          expect(sdk.test()).to.equal('OHAI')
        }
      })
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
})