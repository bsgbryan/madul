const { expect } = require('chai')

const {
  doHydrate
} = require('../lib/DependencyHydrator')

describe('DependencyHydrator', () => {
  describe('doHydrate', () => {
    it('is a function', () =>
      expect(doHydrate).to.be.a('function')
    )

    // it('returns the hydrated dependencies as an object', async () => {
    //   const output = await doHydrate(['chai'])

    //   expect(Object.keys(output).length).to.equal(1)
    // })
  })
})