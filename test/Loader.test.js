const { expect } = require('chai')

const { SCOPE } = require('../lib/DependencySpec')
const   load    = require('../lib/Loader')

describe('Loader', () => {
  describe('load', () => {
    it('is a function', () =>
      expect(load).to.be.a('function')
    )

    it("wraps a madul's source in a function call that passes all sdk functions", async () => {
      const { madul } = await load('example', SCOPE.LOCAL)

      madul.baz({
        done: log => expect(log).to.be.a('function')
      })
    })
  })
})