import {
  describe,
  expect,
  it,
} from "bun:test"

import { managed } from "#Managed/Collection.ts"
import { scope } from "#Managed/Decorator.ts"

import Bootstrap, {
  ExtractFunctions,
  HydrateDecorators,
  HydrateDependencies,
  Path,
  ToObjectLiteral,
} from "#Bootstrap"

import {
  Madul,
  MadulSpec,
  Mode,
  WrappedFunction,
} from "#types.ts"

describe('Path', () => {
  it('is a function', () => expect(typeof Path).toBe('function'))

  it('builds a path from the spec and compilerOptions.paths', async () => {
    const result = await Path('+Foo')

    expect(result).toEqual(`${process.cwd()}/scratch/Foo`)
  })
})

describe('ToObjectLiteral', () => {
  it('converts a Map to an ObjectLiteral', () => {
    const fn = () => {}
    const map = new Map<string, CallableFunction>([['foo', fn], ['baz', fn]])
    const converted = ToObjectLiteral(map)

    expect(converted).toEqual({
      foo: fn,
      baz: fn,
    })
  })
})

describe('HydrateDependencies', () => {
  it('bootstraps each dependency and adds it to the output', async () => {
    const dependencies = () => ({ '+Foo': ['ohai'] })
    const output = { } as Madul

    expect(typeof output.ohai).toEqual('undefined')

    await HydrateDependencies(dependencies, output)

    expect(typeof output.ohai).toEqual('function')
  })
})

describe('HydrateDecorators', () => {
  it('bootstraps each decorator and adds it to the managed collection', async () => {
    const decorators = () => ({ ohai: { before: { '+Bar': ['boom'] } } })

    await HydrateDecorators('+Foo', decorators)

    const hydrated = managed<CallableFunction>(scope('+Foo', 'ohai', Mode.before))
    const dec      = hydrated![0].value as WrappedFunction

    expect(hydrated!.length).toEqual(1)
    expect(hydrated![0].key).toEqual('boom')
    expect(typeof hydrated![0].value).toEqual('function')

    expect(dec._wrapped).toEqual('boom')
  })
})

describe('ExtractFunctions', () => {
  it('merges the input and converts it to a map - filtering out dependencies and decorators functions', () => {
    const mod    = { foo: () => {}, dependencies: () => {}, decorators: () => {} }
    const output = { bar: ()  => {}, $init: () => {} }

    const mapped = ExtractFunctions(mod as MadulSpec, output)
    const iter   = mapped.keys()

    expect(mapped.size).toEqual(3)
    expect(iter.next().value).toEqual('foo')
    expect(iter.next().value).toEqual('bar')
    expect(iter.next().value).toEqual('$init')
  })
})

describe('Bootstrap', () => {
  it('is a function', () => expect(typeof Bootstrap).toBe('function'))

  it('bootstraps stuff', async () => {
    const foo = await Bootstrap('+Foo')

    expect(foo).toBeDefined()

    expect(foo.ohai({ person: 'Bob' })).toEqual('OHAI, Bob! ... Ba Da Boom')
  })

  it('wraps an async function with an async function', async () => {
    const { asink } = await import('../scratch/HasAsyncFun.ts')
    const has = await Bootstrap('+HasAsyncFun')

    expect(asink.constructor.name).toEqual('AsyncFunction')
    expect(has.asink.constructor.name).toEqual('AsyncFunction')
  })

  it('wraps a non-async function with a non-async function', async () => {
    const { sink } = await import('../scratch/HasSyncFun.ts')
    const has = await Bootstrap('+HasSyncFun')

    expect(sink.constructor.name).toEqual('Function')
    expect(has.sink.constructor.name).toEqual('Function')
  })
})