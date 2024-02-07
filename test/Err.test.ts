import {
  describe,
  expect,
  it,
} from "bun:test"

import Bootstrap, { Emitter } from "#Bootstrap"

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
    
    Emitter().on("SIGABRT", ({ message, details }) => {
      expect(message).toEqual('BOOM')
      expect(details.length).toEqual(2)

      expect(details[0]).toEqual({
        fun:   'ohboy',
        line:   2,
        madul: '+Throws',
        params: {
          baz: 'bang',
          boom: 42,
        },
      })

      expect(details[1]).toEqual({
        fun:   'letsBLOW',
        line:   5,
        madul: '+DoesntCatch',
        params: {
          foo: 'bar',
        },
      })
    })

    madul.letsBLOW({ foo: 'bar' })
  })
})