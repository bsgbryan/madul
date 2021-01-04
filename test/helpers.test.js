const { expect } = require('chai')

const { executeAndReset } = require('../lib/helpers')

describe('helpers', () => {
  describe('executeAndReset', () => {
    it('is a function', () =>
      expect(executeAndReset).to.be.a('function')
    )

    // it('executes all passed function and sets the array to undefined', () => {
    //   let   calls     = 0
    //   const inc       = () => calls++
    //   const functions = { test: [inc, inc] }

    //   executeAndReset(functions, 'test')

    //   expect(calls).to.equal(2)
    //   expect(functions.test).to.be.undefined
    // })
  })
})