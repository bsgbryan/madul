const { expect } = require('chai')

const {
  load,
  doHydrate,
  srcLocation
} = require('../lib/DependencyHydrator')

describe('DependencyHydrator', () => {
  describe('load', () => {
    it('is a function', () =>
      expect(load).to.be.a('function')
    )

    it('returns a node module when the path is a node module', async () => {
      const src = `${process.cwd()}/node_modules/chai/./index`

      expect(await load(src).name).to.not.equal('Madul')
    })
  })

  describe('srcLocation', () => {
    it('is a function', () =>
      expect(srcLocation).to.be.a('function')
    )

    it('returns the path to the main source for a node module', async () => {
      const path = `${process.cwd()}/node_modules/chai/./index`

      expect(await srcLocation('chai')).to.equal(path)
    })
  })

  describe('doHydrate', () => {
    it('is a function', () =>
      expect(doHydrate).to.be.a('function')
    )

    it('returns the hydrated dependencies as an object', async () => {
      const output = await doHydrate(['chai'])

      expect(Object.keys(output).length).to.equal(1)
    })
  })
})