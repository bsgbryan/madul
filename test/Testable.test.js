const { expect } = require('chai')

const testable = require('../lib/Testable')

describe('Testable', () => {
  it('is a function', () => expect(testable).to.be.a('function'))

  it('returns the madul, unwrapped', async () => {
    const result = await testable('/example')

    expect(result).to.be.an('object')
    expect(result.baz).to.be.a('function')
    expect(Array.isArray(result.deps)).to.be.true
    expect(result.deps[0]).to.equal('/test')
  })
})