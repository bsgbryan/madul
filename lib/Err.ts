import { readFileSync } from "node:fs"
import path from "node:path"

import {
  formatErrDetails,
  formatErrMessage,
} from "#Context"

import {
  DebugConfig,
  Detail,
  ParameterSet,
} from "#types"

let _err: Err

export const unhandled = () => {
  return _err.throws === 4
}

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
} as Detail)

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

export const details = (params: Array<ParameterSet>, e = _err) => {
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

  return filterExtraneous(e.stack, mapped).
    map(extract(mapped)).
    map(build(params)) as Array<Detail>
}

export const handle = (params?: ParameterSet) => {
  if (params) _err.add(params)
  
  console.error(String(_err))

  if (process.env.NODE_ENV !== 'test') process.exit(1)
}

export const debug = (config: DebugConfig) => {
  config.debug[config.env.current](details(_err.params, _err))
}

const err = (params?: ParameterSet) => (message: string, context?: ParameterSet) => {
  _err = new Err(message, params || {}, context)

  throw _err
}

export const print = () => (
  params: ParameterSet,
  context?: ParameterSet,
) => {
  _err = new Err('', params, context, 0, 'DEBUGGING')

  throw _err
}

export class Err {
  #context: ParameterSet = {}
  #message: string
  #mode:    string
  #params:  Array<ParameterSet> = []
  #stack:   string
  #throws = 0

  constructor(
    message:  string,
    params:   ParameterSet,
    context?: ParameterSet,
    throws =  0,
    mode   = 'ERROR',
    stack  =  new Error(message).stack || '',
    ) {
    this.#message = message
    this.#mode    = mode
    this.#stack   = stack
    this.#throws  = throws

    this.#params.push(params)

    if (context) this.#context = context
  }

  public static from(e: unknown, params?: ParameterSet) {
    const message = e instanceof Error === false ?
      String(e)
      :
      e.message

    const stack = e instanceof Error ?
      e.stack
      :
      undefined

    const _ = new Err(message, params || {}, undefined, 3, 'ERROR', stack)

    _err = _

    return _
  }

  public add (params: ParameterSet) { this.#params.push(params) }

  public consolify() {
    const p     = Object.keys(this.#params).length > 1 ? 'params' : 'param'
    const state = {
      context: details([this.#context])[0],
      [p]:     details(this.#params),
    }

    return `${formatErrMessage(this.#message)}${formatErrDetails(state)}`
  }

  toString() { return this.consolify() }

  get throws() { return ++this.#throws }

  get context() { return this.#context }
  get message() { return this.#message }
  get mode   () { return this.#mode    }
  get params () { return this.#params  }
  get stack  () { return this.#stack   }
}

export default err