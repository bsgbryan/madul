import {
  describe,
  it,
} from "bun:test"

import { print } from "@Debug"

describe('Debug', () => {
  describe('print', () => {
    it('logs to the console for now', async () => {
      const debug = async () => Promise.resolve({ test:     true  })
      const env   = async () => Promise.resolve({ current: 'test' })


      await print({ debug, env, value: 'OHAI' })
    })
  })
})