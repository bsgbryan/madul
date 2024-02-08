import {
  describe,
  it,
} from "bun:test"

import madul, { Emitter } from "#Bootstrap"

describe('Debug', () => {
  describe('print', () => {
    it('prints stuff', async () => {
      const printer = await madul('+Printer')

      Emitter().on("SIGDBUG", ({ details }) => {
        // TODO: Add expects
      })

      printer.printMeBaby()
    })
  })
})