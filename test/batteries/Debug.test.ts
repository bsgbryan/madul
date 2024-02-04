import {
  describe,
  expect,
  it,
} from "bun:test"

import { print } from "@Debug"

describe('Debug', () => {
  describe('print', () => {
    it('logs to the console for now', async () => {
      let printed: string

      const debug = async () => Promise.resolve({ test: (v: string) => { printed = v }})
      const env   = async () => Promise.resolve({ current: 'test' })

      await print({ debug, env, value: 'OHAI' })

      expect(printed!).toEqual('OHAI')
    })
  })
})