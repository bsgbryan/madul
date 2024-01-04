const load    = require('../lib/Loader')
const hydrate = require('../lib/DependencyHydrator')

describe('DependencyHydrator', () => {
  describe('hydrate', () => {
    it('is a function', () =>
      expect(hydrate).to.be.a('function')
    )

    it('is an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(hydrate).constructor

      expect(fn.name).to.equal('AsyncFunction')
    })

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(hydrate()).constructor

      expect(fn.name).to.equal('Promise')
    })

    it('returns the hydrated dependencies as an object when the Promise resolves', async () => {
      const output = await hydrate(['chai'])

      expect(Object.keys(output).length).to.equal(1)
      expect(Object.keys(output)[0]).to.equal('chai')
      expect(output.chai).to.be.an('object')
      expect(output.chai.expect).to.be.a('function')
    })

    describe('when functions are specified', () => {
      it('adds each specified function to the output object directly', async () => {
        const output = await hydrate(['chai[expect]'])

        expect(Object.keys(output).length).to.equal(1)
        expect(Object.keys(output)[0]).to.equal('expect')
        expect(output.expect).to.be.a('function')
      })

      it('does *not* add the root dependency to the output object', async () => {
        const output = await hydrate(['chai[expect]'])

        expect(output.chai).to.be.undefined
      })
    })

    it('returns the madul with all deps ready to go', async () => {
      const loaded   = await load('/hasDeps', { root: process.cwd() })
      const hydrated = await hydrate(loaded.deps)

      expect(hydrated.exampleDep).to.be.an('object')
      expect(hydrated.exampleDep.foo).to.be.a('function')
      expect(hydrated.exampleDep.bar).to.be.a('function')
      expect(hydrated.exampleDep.baz).to.be.a('function')
      expect(hydrated.exampleDep.bang).to.be.a('function')

      expect(hydrated.anotherExampleDep).to.be.an('object')
      expect(hydrated.anotherExampleDep.biff).to.be.a('function')
      expect(hydrated.anotherExampleDep.buzz).to.be.a('function')
      expect(hydrated.anotherExampleDep.boom).to.be.a('function')
      expect(hydrated.anotherExampleDep.boff).to.be.a('function')
    })
  })
})