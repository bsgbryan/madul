import {
  describe,
  expect,
  it,
  test,
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
    
    Emitter().on("SIGABRT", output => {
      expect(output).toEqual('🚨 \u001b[101m\u001b[97m  Error \u001b[39m\u001b[49m \u001b[91mBOOM\u001b[39m\n\u001b[2m---========---\u001b[22m\n   \u001b[101m\u001b[97m  Mädūl \u001b[39m\u001b[49m \u001b[1m\u001b[96m+Throws\u001b[39m\u001b[22m\n   \u001b[101m\u001b[97m    fun \u001b[39m\u001b[49m \u001b[1m\u001b[97mohboy\u001b[39m\u001b[22m \u001b[2mline\u001b[22m \u001b[95m2\u001b[39m\n   \u001b[41m\u001b[97m params \u001b[39m\u001b[49m \u001b[97mbaz\u001b[39m\u001b[2m:\u001b[22m \u001b[37mbang\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m \u001b[97mboom\u001b[39m\u001b[2m:\u001b[22m \u001b[95m42\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m \u001b[97marg\u001b[39m\u001b[2m:\u001b[22m \u001b[32mobject literal\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[37mbam\u001b[39m\u001b[2m:\u001b[22m \u001b[37mfom\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[37mbiz\u001b[39m\u001b[2m:\u001b[22m \u001b[94mfalse\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[37modd\u001b[39m\u001b[2m:\u001b[22m \u001b[32mArray\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m     \u001b[90m0\u001b[39m\u001b[2m:\u001b[22m \u001b[37mtom\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m     \u001b[90m1\u001b[39m\u001b[2m:\u001b[22m \u001b[37mtim\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m     \u001b[90m2\u001b[39m\u001b[2m:\u001b[22m \u001b[37mtam\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m     \u001b[90m3\u001b[39m\u001b[2m:\u001b[22m \u001b[37mtym\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m     \u001b[90m4\u001b[39m\u001b[2m:\u001b[22m \u001b[37mtem\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[37moof\u001b[39m\u001b[2m:\u001b[22m \u001b[32mobject literal\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m     \u001b[37meek\u001b[39m\u001b[2m:\u001b[22m \u001b[37myikes\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m \u001b[97maaa\u001b[39m\u001b[2m:\u001b[22m \u001b[37moh, ok\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m \u001b[97mfun\u001b[39m\u001b[2m:\u001b[22m \u001b[36m[Function]\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m \u001b[97myay\u001b[39m\u001b[2m:\u001b[22m \u001b[32mArray\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[90m 0\u001b[39m\u001b[2m:\u001b[22m \u001b[95m0\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[90m 1\u001b[39m\u001b[2m:\u001b[22m \u001b[95m1\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[2m    ...\u001b[22m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[90m 9\u001b[39m\u001b[2m:\u001b[22m \u001b[95m9\u001b[39m\n   \u001b[41m\u001b[97m        \u001b[39m\u001b[49m   \u001b[90m10\u001b[39m\u001b[2m:\u001b[22m \u001b[95m10\u001b[39m\n\u001b[2m---========---\u001b[22m\n   \u001b[101m\u001b[97m  Mädūl \u001b[39m\u001b[49m \u001b[1m\u001b[96m+DoesntCatch\u001b[39m\u001b[22m\n   \u001b[101m\u001b[97m    fun \u001b[39m\u001b[49m \u001b[1m\u001b[97mletsBLOW\u001b[39m\u001b[22m \u001b[2mline\u001b[22m \u001b[95m5\u001b[39m\n   \u001b[41m\u001b[97m  param \u001b[39m\u001b[49m \u001b[97mfoo\u001b[39m\u001b[2m:\u001b[22m \u001b[37mbar\u001b[39m\n\u001b[2m---========---\u001b[22m')
    })

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