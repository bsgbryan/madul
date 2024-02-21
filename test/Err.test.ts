import {
  describe,
  expect,
  it,
  test,
} from "bun:test"

import Bootstrap from "#Bootstrap"

import { OhBoyErr } from "+Throws"

describe('Err', () => {
  it('can be caught', async () => {
    expect((await Bootstrap('+Catches')).letsGO()).toEqual('BOOM')
  })

  test('what happens when a top-level function thows?', async () => {
    try { (await Bootstrap('+Throws')).ohboy({ here: 'We GO!', o: 42, hai: undefined }) }
    catch (e) {
      console.error(String(e))

      const err = e as unknown as OhBoyErr

      console.log('extra', err.context.extra)
    }
  })

  describe('print', () => {
    it('prints stuff', async () => {
      (await Bootstrap('+Printer')).printMeBaby()
    })
  })
})

describe('Error', () => {
  it('gets converted to Err and output', async () => {
    (await Bootstrap('+ReallyThrows')).begBada({ foo: 'bar', baz: false })
  })
})

describe('when Error is a non-error value', () => {
  it('ouputs the value as the Err message', async () => {
    (await Bootstrap('+ThrowsNumber')).ohno()
  })
})