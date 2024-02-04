import {
  describe,
  expect,
  it,
} from "bun:test"

import Bootstrap, { Emitter } from "#Bootstrap"

describe('Err', () => {
  it('filters the stack trace to be only project-local lines', async () => {
    const madul = await Bootstrap('+Throws')

    try { madul.ohboy() }
    catch (e) { expect((e as unknown as Error).message).toEqual('BOOM')}
  })

  it('can be caught', async () => {
    const madul = await Bootstrap('+Catches')

    expect(madul.letsGO()).toEqual('BOOM')
  })

  it('emits a SIGABRT event when not caught by the calling function', async () => {
    const madul = await Bootstrap('+DoesntCatch')
    
    Emitter().on("SIGABRT", ({ heading, details }) => {
      expect(heading).toInclude('BOOM')
      expect(details).toInclude('+Throws')
      expect(details).toInclude('ohboy')
      expect(details).toInclude('2')
      expect(details).toInclude('+DoesntCatch')
      expect(details).toInclude('letsBLOW')
      expect(details).toInclude('5')
    })

    madul.letsBLOW()
  })
})