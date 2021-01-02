const { expect } = require('chai')

const { tmpdir } = require('os')

const { SCOPE } = require('../lib/DependencySpec')
const   load    = require('../lib/Loader')
const  tmpFile  = require('../lib/Loader/tmpFile')

const wrapped = `
module.exports = sdk => {
consoole.log("OHAI")

return exports || module.exports

}
`

describe('Loader', () => {
  describe('load', () => {
    it('is a function', () =>
      expect(load).to.be.a('function')
    )

    it("wraps a madul's source in a function call that passes all sdk functions", async () => {
      const madul = await load('example', SCOPE.LOCAL)

      madul.baz({
        done: sdk => expect(sdk.events.log).to.be.a('function')
      })
    })
  })

  describe('tmpFile', () => {
    it('is a function', () =>
      expect(tmpFile).to.be.a('function')
    )

    it('returns the path to the created tmp file', async () => {
      const path = `${tmpdir()}/madul/scratch/example.js`

      expect(await tmpFile('example')).to.equal(path)
    })
  })

  describe('tmpFile.wrap', () => {
    it('is a function', () =>
      expect(tmpFile.wrap).to.be.a('function')
    )

    it('retruns the argument passed wrapped with the code used to pass the sdk to maduls', () => {
      expect(tmpFile.wrap('consoole.log("OHAI")')).to.equal(wrapped)
    })
  })
})