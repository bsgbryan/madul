const { expect } = require('chai')

const {
  executeAndDelete
} = require('../lib/helpers')

describe.only('helpers', () => {
  describe('executeAndDelete', () => {
    it('is a function', () =>
      expect(executeAndDelete).to.be.a('function')
    )

    it('executes all passed function and sets the array to undefined', () => {
      let   calls     = 0
      const inc       = () => calls++
      const functions = { test: [inc, inc] }

      executeAndDelete(functions, 'test')

      expect(calls).to.equal(2)
      expect(functions.test).to.be.undefined
    })
  })
})