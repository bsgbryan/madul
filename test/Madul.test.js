const { expect } = require('chai')

const initialize = require('../lib/Madul')

describe('Madul', () => {
  describe('initialize', () => {
    it('is a function', () =>
      expect(initialize).to.be.a('function')
    )
  })
})