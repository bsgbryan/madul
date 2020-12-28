const { expect } = require('chai')

const {
  SCOPE,
  parse,
  build,
  extractScopeAndHandleFrom,
  extractInitializerAndPrerequisites
} = require('../lib/DependencySpec')


describe('DependencySpec', () => {
  describe('extractScopeAndHandleFrom', () => {
    it('is a function', () =>
      expect(extractScopeAndHandleFrom).to.be.a('function')
    )

    it('returns SCOPE.NODE when the ~ is specified', () => {
      const [scope, _] = extractScopeAndHandleFrom('~test')

      expect(scope).to.equal(SCOPE.NODE)
    })

    it('returns SCOPE.LOCAL when . is specified', () => {
      const [scope, _] = extractScopeAndHandleFrom('/test')

      expect(scope).to.equal(SCOPE.LOCAL)
    })

    it('returns SCOPE.DEFAULT when nothing is specified', () => {
      const [scope, _] = extractScopeAndHandleFrom('test')

      expect(scope).to.equal(SCOPE.DEFAULT)
    })

    it('returns the value of the handle specified', () => {
      const [_, handle] = extractScopeAndHandleFrom('~test')

      expect(handle).to.equal('test')
    })
  })

  describe('extractInitializerAndPrerequisites', () => {
    it('is a function', () =>
      expect(extractInitializerAndPrerequisites).to.be.a('function')
    )

    it('returns the initializer specified', () => {
      const [initializerZero, _] = extractInitializerAndPrerequisites('init')

      expect(initializerZero).to.equal('init')

      const [initializerOne, __] = extractInitializerAndPrerequisites('init:foo')

      expect(initializerOne).to.equal('init')
    })

    it('returns the preqrequisites specified, as an array', () => {
      const [_, prerequisitesZero] = extractInitializerAndPrerequisites('init')

      expect(prerequisitesZero.length).to.equal(0)

      const [__, prerequisitesOne] = extractInitializerAndPrerequisites('init:foo,bar')

      expect(prerequisitesOne.length).to.equal(2)
    })

    it('preserves the order of the prerequisites specified', () => {
      const [_, prerequisites] = extractInitializerAndPrerequisites('init:foo,bar')

      expect(prerequisites[0]).to.equal('foo')
      expect(prerequisites[1]).to.equal('bar')
    })
  })

  describe('parse', () => {
    it('is a function', () =>
      expect(parse).to.be.a('function')
    )

    it('returns the correct data when only a handle is specified', () => {
      const parsed = parse('test')

      expect(parsed.ref).to.equal('test')
      expect(parsed.alias).to.be.undefined
      expect(parsed.scope).to.equal(SCOPE.DEFAULT)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.be.undefined
      expect(parsed.prerequisites.length).to.equal(0)
    })

    it('returns the correct data when a handle and scope are specified', () => {
      const parsed = parse('~test')

      expect(parsed.ref).to.equal('test')
      expect(parsed.alias).to.be.undefined
      expect(parsed.scope).to.equal(SCOPE.NODE)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.be.undefined
      expect(parsed.prerequisites.length).to.equal(0)
    })

    it('returns the correct data when a handle and alias are specified', () => {
      const parsed = parse('test -> TEST')

      expect(parsed.ref).to.equal('TEST')
      expect(parsed.alias).to.equal('TEST')
      expect(parsed.scope).to.equal(SCOPE.DEFAULT)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.be.undefined
      expect(parsed.prerequisites.length).to.equal(0)
    })

    it('returns the correct data when a handle, alias, and initializer are specified', () => {
      const parsed = parse('test -> TEST = init')

      expect(parsed.ref).to.equal('TEST')
      expect(parsed.alias).to.equal('TEST')
      expect(parsed.scope).to.equal(SCOPE.DEFAULT)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.equal('init')
      expect(parsed.prerequisites.length).to.equal(0)
    })

    it('returns the correct data when a handle, alias, initializer, and prerequisites are specified', () => {
      const parsed = parse('test -> TEST = init:foo,bar,baz')

      expect(parsed.ref).to.equal('TEST')
      expect(parsed.alias).to.equal('TEST')
      expect(parsed.scope).to.equal(SCOPE.DEFAULT)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.equal('init')
      expect(parsed.prerequisites.length).to.equal(3)
      expect(parsed.prerequisites[0]).to.equal('foo')
      expect(parsed.prerequisites[1]).to.equal('bar')
      expect(parsed.prerequisites[2]).to.equal('baz')
    })

    it('returns the correct data when a handle, initializer, and prerequisites are specified', () => {
      const parsed = parse('test = init:foo,bar,baz')

      expect(parsed.ref).to.equal('test')
      expect(parsed.alias).to.be.undefined
      expect(parsed.scope).to.equal(SCOPE.DEFAULT)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.equal('init')
      expect(parsed.prerequisites.length).to.equal(3)
      expect(parsed.prerequisites[0]).to.equal('foo')
      expect(parsed.prerequisites[1]).to.equal('bar')
      expect(parsed.prerequisites[2]).to.equal('baz')
    })

    it('returns the correct data when a handle, scope, initializer, and prerequisites are specified', () => {
      const parsed = parse('/test = init:foo,bar')

      expect(parsed.ref).to.equal('test')
      expect(parsed.alias).to.be.undefined
      expect(parsed.scope).to.equal(SCOPE.LOCAL)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.equal('init')
      expect(parsed.prerequisites.length).to.equal(2)
      expect(parsed.prerequisites[0]).to.equal('foo')
      expect(parsed.prerequisites[1]).to.equal('bar')
    })

    it('returns the correct data when functions are specified', () => {
      const parsed = parse('test[foo,bar,baz,bang]')

      expect(parsed.ref).to.equal('test')
      expect(parsed.functions.length).to.equal(4)
      expect(parsed.functions[0]).to.equal('foo')
      expect(parsed.functions[1]).to.equal('bar')
      expect(parsed.functions[2]).to.equal('baz')
      expect(parsed.functions[3]).to.equal('bang')

      expect(parsed.alias).to.be.undefined
      expect(parsed.scope).to.equal(SCOPE.DEFAULT)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.be.undefined
      expect(parsed.prerequisites.length).to.equal(0)
    })

    it('ignores whitespace', () => {
      const parsed = parse(' / test   = init : foo ,     bar ')

      expect(parsed.ref).to.equal('test')
      expect(parsed.alias).to.be.undefined
      expect(parsed.scope).to.equal(SCOPE.LOCAL)
      expect(parsed.handle).to.equal('test')
      expect(parsed.initializer).to.equal('init')
      expect(parsed.prerequisites.length).to.equal(2)
      expect(parsed.prerequisites[0]).to.equal('foo')
      expect(parsed.prerequisites[1]).to.equal('bar')
    })
  })

  describe('build', () => {
    it('is a function', () =>
      expect(build).to.be.a('function')
    )

    describe('The handle argument', () => {
      it('is required', () =>
        expect(() => build({ handle: undefined })).
        to.throw('A non-empty handle is required to create a Dependency Spec')
      )

      it('is the only ouput token when it is the only input token', () =>
        expect(build({ handle: 'test' })).
        to.equal('test')
      )

      it('immediately precedes the alias when one is specified', () =>
        expect(
          build({
            handle: 'test',
            alias:  'TEST'
          })
        ).to.equal('test -> TEST')
      )

      it('immediately precedes the initializer when one is specified (without an alias being specified)', () =>
        expect(
          build({
            handle:      'test',
            initializer: 'init'
          })
        ).to.equal('test = init')
      )
    })

    describe('The alias argument', () => {
      it('is not required', () =>
        expect(
          build({
            handle: 'test',
            alias:  undefined
          })
        ).to.equal('test')
      )

      it('immediately follows the alias token when specified', () =>
        expect(
          build({
            handle: 'test',
            alias: 'TEST'
          })
        ).to.equal('test -> TEST')
      )

      it('immediately precedes the initializer when one is specified', () =>
        expect(
          build({
            handle:      'test',
            initializer: 'init',
            alias:       'TEST'
          })
        ).to.equal('test -> TEST = init')
      )
    })

    describe('The initializer argument', () => {
      it('is not required', () =>
        expect(
          build({
            handle:     'test',
            initializer: undefined
          })
        ).to.equal('test')
      )

      it('immediately follows the handle when no alias is specified', () =>
        expect(
          build({
            handle:      'test',
            initializer: 'init'
          })
        ).to.equal('test = init')
      )

      it('immediately follows the alias when one is specified', () =>
        expect(
          build({
            handle:      'test',
            alias:       'TEST',
            initializer: 'init'
          })
        ).to.equal('test -> TEST = init')
      )
    })

    describe('The prerequisites argument', () => {
      it('requires an initializer to be specified', () =>
        expect(
          () => build({
            handle:        'test',
            initializer:    undefined,
            prerequisites: ['foo']
          })
        ).to.throw('Prerequisites require an initializer')
      )

      it('immediately follows the initializer when one is specified', () =>
        expect(
          build({
            handle:        'test',
            initializer:   'init',
            prerequisites: ['foo']
          })
        ).to.equal('test = init:foo')
      )

      it('seperates prerequisites using commas in the output', () =>
        expect(
          build({
            handle:        'test',
            initializer:   'init',
            prerequisites: ['foo', 'bar']
          })
        ).to.equal('test = init:foo,bar')
      )

      it('outputs prerequisites in the same order they are specified', () =>
        expect(
          build({
            handle:        'test',
            initializer:   'init',
            prerequisites: ['second', 'first']
          })
        ).to.equal('test = init:second,first')
      )
    })
  })
})