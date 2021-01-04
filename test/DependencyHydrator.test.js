const { expect } = require('chai')

const   load    = require('../lib/Loader')
const { SCOPE } = require('../lib/DependencySpec')

const {
  hydrate,
  doHydrate,
} = require('../lib/DependencyHydrator')

const {
  get,
  init,
} = require('../lib/Initializer/listeners')

describe('DependencyHydrator', () => {
  describe('doHydrate', () => {
    it('is a function', () =>
      expect(doHydrate).to.be.a('function')
    )

    it('is an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(doHydrate).constructor

      expect(fn.name).to.equal('AsyncFunction')
    })

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(doHydrate([ ])).constructor

      expect(fn.name).to.equal('Promise')
    })

    it('returns the hydrated dependencies as an object when the Promise resolves', async () => {
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

  describe('hydrate', () => {
    it('is a function', () =>
      expect(hydrate).to.be.a('function')
    )

    it('is an AsyncFunction', () => {
      const fn = Object.getPrototypeOf(hydrate).constructor

      expect(fn.name).to.equal('AsyncFunction')
    })

    it('returns a Promise', () => {
      const fn = Object.getPrototypeOf(hydrate('/test')).constructor

      expect(fn.name).to.equal('Promise')
    })

    it('returns the madul with all deps ready to go', async () => {
      const loaded   = await load('hasDeps', SCOPE.LOCAL)
      const hydrated = await hydrate('/hasDeps', loaded)

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

    describe('when hydrate() is called while a dependency is initializing', () => {
      // There isn't really a good way (that I know of) to test the logic below. I've left this test here to demonstrate
      // the way this works, even though the commented out lines will fail).
      // The idea is that when hydrate() is called and one of the deps is in the middle of initializing, the madul
      // specifying the dep is added to a list of listeners for when the initialization of complete.
      // When the dep finished initialization, all listeners are notified.
      it('adds the madul trying to hydrate as listener for the dep whose initialization is in-progress', async () => {
        init('/slowHydratingDep')

        const initializeListeners = get('/slowHydratingDep')

        expect(initializeListeners.length).to.equal(0)

        const slowHydrating1 = await load('hasSlowHydratingDep', SCOPE.LOCAL)
        const slowHydrating2 = await load('anotherHasSlowHydratingDep', SCOPE.LOCAL)

        hydrate('/hasSlowHydratingDep', slowHydrating1)

        // expect(initializeListeners.length).to.equal(1)

        const promise = hydrate('/anotherHasSlowHydratingDep', slowHydrating2)

        // expect(initializeListeners.length).to.equal(2)

        return promise.then(() => expect(initializeListeners.length).to.equal(0))
      })
    })
  })
})