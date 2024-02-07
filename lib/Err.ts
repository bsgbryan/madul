import { readFileSync } from "node:fs"
import path from "node:path"

import { Emitter } from "#Bootstrap"

import { ParameterSet } from "#types"

let _err
let _throws = 0

export const unhandled = () => ++_throws === 4

export const extract = (
  mapped: { [r: string]: string }
) => (
  trace: string
) => {
  const tokens = trace.split(' ')

  const fun = tokens[0] === '<anonymous>' ? tokens[0].substring(1, tokens[0].length - 1) : tokens[0],
        loc = tokens[1].substring(1, tokens[1].length - 1).split(':'),
        __m = Object.keys(mapped).find(m => loc[0].startsWith(m)),
        mad = loc[0].replace(`${__m!}/`, mapped[__m!])

  return {
    fun,
    line:  loc[1],
    madul: mad.substring(0, mad.length - 3),
  }
}

export const build = (
  params: Array<ParameterSet>
) => (
  s: { fun: string, madul: string, line: string },
  i: number,
) => ({
  fun:    s.fun,
  line:   Number(s.line),
  madul:  s.madul,
  params: params[i],
})

export const filterExtraneous = (
  stack: string,
  mapped: { [r: string]: string },
) => {
  return stack.
    split(/\s+at\s+/).
    filter((s: string) => s.includes('Bootstrap.ts') === false).
    filter((s: string) => s.includes(__filename) === false).
    filter((s: string) => Object.keys(mapped).find(m => s.includes(m)) !== undefined)
}

export const emitSIGABRT = (params: Array<ParameterSet>) => {
  const file   = `${process.cwd()}/tsconfig.json`,
        config = readFileSync(file, { encoding: 'utf8'}),
        paths  = JSON.
          parse(config)?.
          compilerOptions?.
          paths
  
  const mapped = { } as { [r: string]: string }

  for (const [k, v] of Object.entries(paths))
    for (const p of v as Array<string>) {
      const m = path.normalize(`${process.cwd()}/${p.substring(0, p.length - 2)}`)

      mapped[m] = k.substring(0, k.length - 1);
    }

  const details = filterExtraneous(_err!.stack, mapped).
    map(extract(mapped)).
    map(build(params))

  Emitter().emit("SIGABRT", { message: _err!.message, details })
}

const err = (params?: ParameterSet) => (message: string) => {
  _err = new Err(message, params || {})

  throw _err
}

export class Err {
  #message: string
  #params:  Array<ParameterSet> = []
  #stack?:  string

  constructor(
    message: string,
    params:  ParameterSet,
    ) {
    this.#message = message
    this.#stack   = new Error(message).stack

    this.#params.push(params)
  }

  public add (params: ParameterSet) { this.#params.push(params) }

  get message() { return this.#message }
  get params () { return this.#params  }
  get stack  () { return this.#stack   }
}

export default err