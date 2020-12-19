const { expect } = require('chai')

const {
  Madul,
  initialize
} = require('../lib/Madul')

class Test extends Madul {
  deps = ['fs', 'path']
}

describe('Madul', () => {
  it('is a named class', () =>
    expect(Madul.prototype.constructor.name).to.equal('Madul')
  )

  it('does ... something', async () => {
    const test = await initialize(Test)

    // console.log(test.deps)
  })
})