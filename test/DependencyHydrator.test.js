const { expect } = require('chai')

const {
  doHydrate
} = require('../lib/DependencyHydrator')

describe('DependencyHydrator', () => {
  describe('doHydrate', () => {
    it('is a function', () =>
      expect(doHydrate).to.be.a('function')
    )

    it('returns the hydrated dependencies as an object', async () => {
      const output = await doHydrate(['chai'])

      expect(Object.keys(output).length).to.equal(1)
      expect(Object.keys(output)[0]).to.equal('chai')
      expect(output.chai).to.be.an('object')
      expect(output.chai.expect).to.be.a('function')
    })

    describe('when functions are specified', () => {
      it('adds each specified function to the output object directly', async () => {
        const output = await doHydrate(['chai[expect]'])

        expect(Object.keys(output).length).to.equal(1)
        expect(Object.keys(output)[0]).to.equal('expect')
        expect(output.expect).to.be.a('function')
      })

      it('does *not* add the root dependency to the output object', async () => {
        const output = await doHydrate(['chai[expect]'])

        expect(output.chai).to.be.undefined
      })
    })
  })
})