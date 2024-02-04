import { readFileSync } from "node:fs"
import path from "node:path"

import { Emitter } from "#Bootstrap"

const colours = {
  reset:      "\x1b[0m",
  bright:     "\x1b[1m",
  dim:        "\x1b[2m",
  underscore: "\x1b[4m",
  blink:      "\x1b[5m",
  reverse:    "\x1b[7m",
  hidden:     "\x1b[8m",
  
  fg: {
    black:   "\x1b[30m",
    red:     "\x1b[31m",
    green:   "\x1b[32m",
    yellow:  "\x1b[33m",
    blue:    "\x1b[34m",
    magenta: "\x1b[35m",
    cyan:    "\x1b[36m",
    white:   "\x1b[37m",
    gray:    "\x1b[90m",
    crimson: "\x1b[38m",
  },
  bg: {
    black:   "\x1b[40m",
    red:     "\x1b[41m",
    green:   "\x1b[42m",
    yellow:  "\x1b[43m",
    blue:    "\x1b[44m",
    magenta: "\x1b[45m",
    cyan:    "\x1b[46m",
    white:   "\x1b[47m",
    gray:    "\x1b[100m",
    crimson: "\x1b[48m",
  }
}

let _err
let _throws = 0

export const thrown = () => _throws++ > 2

export const emitSIGABRT = () => {
  const paths = JSON.parse(readFileSync(`${process.cwd()}/tsconfig.json`, { encoding: 'utf8'}))?.compilerOptions?.paths,
        mapped = { } as { [r: string]: string }

  for (const [k, v] of Object.entries(paths))
    for (const p of v as Array<string>) {
      const m = path.normalize(`${process.cwd()}/${p.substring(0, p.length - 2)}`)

      mapped[m] = k.substring(0, k.length - 1);
    }

  const heading = `🚨 ${colours.bg.red}${colours.fg.white}${colours.bright} Message: ${colours.reset} ${colours.fg.red}${_err!.message}${colours.reset}\n`,
      { stack } = _err!,
        details = stack!.
          split(/\s+at\s+/).
          filter((s: string) => s.includes('Bootstrap.ts') === false).
          filter((s: string) => s.includes(__filename) === false).
          filter((s: string) => Object.keys(mapped).find(m => s.includes(m)) !== undefined).
          map((s: string) => {
            const tokens = s.split(' ')

            const fun = tokens[0] === '<anonymous>' ? tokens[0].substring(1, tokens[0].length - 1) : tokens[0],
                  loc = tokens[1].substring(1, tokens[1].length - 1).split(':'),
                  __m = Object.keys(mapped).find(m => loc[0].startsWith(m)),
                  mad = loc[0].replace(`${__m!}/`, mapped[__m!])

            return {
              fun,
              madul: mad.substring(0, mad.length - 3),
              line:  loc[1],
            }      
          }).
          map((s: { fun: string, madul: string, line: string }) => {
            let output =  `   ${colours.fg.white}${colours.bg.red}${colours.bright}   Mädūl: ${colours.reset} ${colours.fg.cyan}${colours.bright}${s.madul}${colours.reset}\n`
                output += `   ${colours.fg.white}${colours.bg.red}${colours.bright}     fun: ${colours.reset} ${colours.fg.white}${colours.bright}${s.fun}${colours.reset}\n`
                output += `   ${colours.fg.white}${colours.bg.red}${colours.bright}    line: ${colours.reset} ${colours.fg.yellow}${colours.bright}${s.line}${colours.reset}\n`

            return output
          }).
          join(`${colours.dim}---==========---${colours.reset}\n`)

  Emitter().emit("SIGABRT", { heading, details })
}

const err = (message: string) => {
  _err = new Error(message)

  throw _err
}

export default err