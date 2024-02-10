import {
  describe,
  expect,
  it,
  test,
} from "bun:test"

import Bootstrap from "#Bootstrap"

import { Err } from "#Err"

describe('Err', () => {
  it('filters the stack trace to be only project-local lines', async () => {
    const madul = await Bootstrap('+Throws')

    try { madul.ohboy() }
    catch (e) { expect((e as unknown as Err).message).toEqual('BOOM')}
  })

  it('can be caught', async () => {
    const madul = await Bootstrap('+Catches')

    expect(madul.letsGO()).toEqual('BOOM')
  })

  it('emits a SIGABRT event when not caught by the calling function', async () => {
    const madul = await Bootstrap('+DoesntCatch')

    madul.letsBLOW({ foo: 'bar' })
  })

  test('what happens when a top-level function thows?', async () => {
    const example = await Bootstrap('+Throws')

    try { example.ohboy({ here: 'We GO!'}) }
    catch (e) { console.error((e as unknown as Err).consolify())}
  })

  describe('print', () => {
    it('prints stuff', async () => {
      const printer = await Bootstrap('+Printer')

      printer.printMeBaby()
    })
  })
})