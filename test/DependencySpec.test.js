import {
  describe,
  expect,
  it,
} from "bun:test"

const {
  SCOPE,
  parse,
  build,
} = require('../lib/DependencySpec')

const extractScopeAndHandle              = require('../lib/DependencySpec/extractScopeAndHandle')
const extractInitializerAndPrerequisites = require('../lib/DependencySpec/extractInitializerAndPrerequisites')

describe('DependencySpec', () => {
  describe('extractScopeAndHandle', () => {
    it('is a function', () =>
      expect(typeof extractScopeAndHandle).toBe('function')
    )

    it('returns SCOPE.LOCAL when . is specified', () => {
      const [scope, _] = extractScopeAndHandle('/test', SCOPE)

      expect(scope).toEqual(SCOPE.LOCAL)
    })

    it('returns SCOPE.DEFAULT when nothing is specified', () => {
      const [scope, _] = extractScopeAndHandle('test', SCOPE)

      expect(scope).toEqual(SCOPE.DEFAULT)
    })

    it('returns the value of the handle specified', () => {
      const [_, handle] = extractScopeAndHandle('/test', SCOPE)

      expect(handle).toEqual('test')
    })
  })

  describe('extractInitializerAndPrerequisites', () => {
    it('is a function', () =>
      expect(typeof extractInitializerAndPrerequisites).toBe('function')
    )

    it('returns the initializer specified', () => {
      const [initializerZero, _] = extractInitializerAndPrerequisites('init')

      expect(initializerZero).toEqual('init')

      const [initializerOne, __] = extractInitializerAndPrerequisites('init:foo')

      expect(initializerOne).toEqual('init')
    })

    it('returns the preqrequisites specified, as an array', () => {
      const [_, prerequisitesZero] = extractInitializerAndPrerequisites('init')

      expect(prerequisitesZero.length).toEqual(0)

      const [__, prerequisitesOne] = extractInitializerAndPrerequisites('init:foo,bar')

      expect(prerequisitesOne.length).toEqual(2)
    })

    it('preserves the order of the prerequisites specified', () => {
      const [_, prerequisites] = extractInitializerAndPrerequisites('init:foo,bar')

      expect(prerequisites[0]).toEqual('foo')
      expect(prerequisites[1]).toEqual('bar')
    })
  })

  describe('parse', () => {
    it('is a function', () =>
      expect(typeof parse).toBe('function')
    )

    it('returns the correct data when only a handle is specified', () => {
      const parsed = parse('test')

      expect(parsed.ref).toEqual('test')
      expect(parsed.alias).toBeUndefined()
      expect(parsed.scope).toEqual(SCOPE.DEFAULT)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toBeUndefined()
      expect(parsed.prerequisites.length).toEqual(0)
    })

    it('returns the correct data when a handle and scope are specified', () => {
      const parsed = parse('/test')

      expect(parsed.ref).toEqual('test')
      expect(parsed.alias).toBeUndefined()
      expect(parsed.scope).toEqual(SCOPE.LOCAL)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toBeUndefined()
      expect(parsed.prerequisites.length).toEqual(0)
    })

    it('returns the correct data when a handle and alias are specified', () => {
      const parsed = parse('test -> TEST')

      expect(parsed.ref).toEqual('TEST')
      expect(parsed.alias).toEqual('TEST')
      expect(parsed.scope).toEqual(SCOPE.DEFAULT)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toBeUndefined()
      expect(parsed.prerequisites.length).toEqual(0)
    })

    it('returns the correct data when a handle, alias, and initializer are specified', () => {
      const parsed = parse('test -> TEST = init')

      expect(parsed.ref).toEqual('TEST')
      expect(parsed.alias).toEqual('TEST')
      expect(parsed.scope).toEqual(SCOPE.DEFAULT)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toEqual('init')
      expect(parsed.prerequisites.length).toEqual(0)
    })

    it('returns the correct data when a handle, alias, initializer, and prerequisites are specified', () => {
      const parsed = parse('test -> TEST = init:foo,bar,baz')

      expect(parsed.ref).toEqual('TEST')
      expect(parsed.alias).toEqual('TEST')
      expect(parsed.scope).toEqual(SCOPE.DEFAULT)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toEqual('init')
      expect(parsed.prerequisites.length).toEqual(3)
      expect(parsed.prerequisites[0]).toEqual('foo')
      expect(parsed.prerequisites[1]).toEqual('bar')
      expect(parsed.prerequisites[2]).toEqual('baz')
    })

    it('returns the correct data when a handle, initializer, and prerequisites are specified', () => {
      const parsed = parse('test = init:foo,bar,baz')

      expect(parsed.ref).toEqual('test')
      expect(parsed.alias).toBeUndefined()
      expect(parsed.scope).toEqual(SCOPE.DEFAULT)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toEqual('init')
      expect(parsed.prerequisites.length).toEqual(3)
      expect(parsed.prerequisites[0]).toEqual('foo')
      expect(parsed.prerequisites[1]).toEqual('bar')
      expect(parsed.prerequisites[2]).toEqual('baz')
    })

    it('returns the correct data when a handle, scope, initializer, and prerequisites are specified', () => {
      const parsed = parse('/test = init:foo,bar')

      expect(parsed.ref).toEqual('test')
      expect(parsed.alias).toBeUndefined()
      expect(parsed.scope).toEqual(SCOPE.LOCAL)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toEqual('init')
      expect(parsed.prerequisites.length).toEqual(2)
      expect(parsed.prerequisites[0]).toEqual('foo')
      expect(parsed.prerequisites[1]).toEqual('bar')
    })

    it('returns the correct data when functions are specified', () => {
      const parsed = parse('test[foo,bar,baz,bang]')

      expect(parsed.ref).toEqual('test')
      expect(parsed.functions.length).toEqual(4)
      expect(parsed.functions[0]).toEqual('foo')
      expect(parsed.functions[1]).toEqual('bar')
      expect(parsed.functions[2]).toEqual('baz')
      expect(parsed.functions[3]).toEqual('bang')

      expect(parsed.alias).toBeUndefined()
      expect(parsed.scope).toEqual(SCOPE.DEFAULT)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toBeUndefined()
      expect(parsed.prerequisites.length).toEqual(0)
    })

    it('ignores whitespace', () => {
      const parsed = parse(' / test   = init : foo ,     bar ')

      expect(parsed.ref).toEqual('test')
      expect(parsed.alias).toBeUndefined()
      expect(parsed.scope).toEqual(SCOPE.LOCAL)
      expect(parsed.handle).toEqual('test')
      expect(parsed.initializer).toEqual('init')
      expect(parsed.prerequisites.length).toEqual(2)
      expect(parsed.prerequisites[0]).toEqual('foo')
      expect(parsed.prerequisites[1]).toEqual('bar')
    })
  })

  describe('build', () => {
    it('is a function', () =>
      expect(typeof build).toBe('function')
    )

    describe('The handle argument', () => {
      it('is required', () =>
        expect(() => build({ handle: undefined })).
        toThrow('A non-empty handle is required to create a Dependency Spec')
      )

      it('is the only ouput token when it is the only input token', () =>
        expect(build({ handle: 'test' })).
        toEqual('test')
      )

      it('immediately precedes the alias when one is specified', () =>
        expect(
          build({
            handle: 'test',
            alias:  'TEST'
          })
        ).toEqual('test -> TEST')
      )

      it('immediately precedes the initializer when one is specified (without an alias being specified)', () =>
        expect(
          build({
            handle:      'test',
            initializer: 'init'
          })
        ).toEqual('test = init')
      )
    })

    describe('The alias argument', () => {
      it('is not required', () =>
        expect(
          build({
            handle: 'test',
            alias:  undefined
          })
        ).toEqual('test')
      )

      it('immediately follows the alias token when specified', () =>
        expect(
          build({
            handle: 'test',
            alias: 'TEST'
          })
        ).toEqual('test -> TEST')
      )

      it('immediately precedes the initializer when one is specified', () =>
        expect(
          build({
            handle:      'test',
            initializer: 'init',
            alias:       'TEST'
          })
        ).toEqual('test -> TEST = init')
      )
    })

    describe('The initializer argument', () => {
      it('is not required', () =>
        expect(
          build({
            handle:     'test',
            initializer: undefined
          })
        ).toEqual('test')
      )

      it('immediately follows the handle when no alias is specified', () =>
        expect(
          build({
            handle:      'test',
            initializer: 'init'
          })
        ).toEqual('test = init')
      )

      it('immediately follows the alias when one is specified', () =>
        expect(
          build({
            handle:      'test',
            alias:       'TEST',
            initializer: 'init'
          })
        ).toEqual('test -> TEST = init')
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
        ).toThrow('Prerequisites require an initializer')
      )

      it('immediately follows the initializer when one is specified', () =>
        expect(
          build({
            handle:        'test',
            initializer:   'init',
            prerequisites: ['foo']
          })
        ).toEqual('test = init:foo')
      )

      it('seperates prerequisites using commas in the output', () =>
        expect(
          build({
            handle:        'test',
            initializer:   'init',
            prerequisites: ['foo', 'bar']
          })
        ).toEqual('test = init:foo,bar')
      )

      it('outputs prerequisites in the same order they are specified', () =>
        expect(
          build({
            handle:        'test',
            initializer:   'init',
            prerequisites: ['second', 'first']
          })
        ).toEqual('test = init:second,first')
      )
    })
  })
})