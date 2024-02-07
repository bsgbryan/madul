import colors from "ansi-colors"

import { WrappedFunction } from "#types"

type Detail = {
  fun: string
  madul: string
  line: string
  params: {
    [key: string]: unknown
  }
}

const dim   = colors.dim,
      error = colors.redBright,
      fun   = colors.bold.whiteBright,
      label = colors.bgRedBright.whiteBright,
      line  = colors.yellowBright,
      madul = colors.bold.cyanBright,
      name  = colors.whiteBright

const seperator = dim('---==========---'),
      key       = (text = '') => `   ${label(`${text.padStart(7)} `)}`

export const func = (type: string, name?: string) => {
  return name ?
    [
      `${colors.cyan('[')}`,
      `${colors.cyanBright(type)}`,
      `${colors.dim(':')}`,
      `${colors.bold.cyanBright(String(name))}`,
      `${colors.cyan(']')}`,
    ].join('')
    :
    `${colors.cyan(`[${type}]`)}`
}

export const arr = (items: Array<unknown>): Array<string> => {
  const width  = String(items.length).length,
        output = [`${colors.green('Array')}`]

  if (items.length <= 5)
    return output.concat(
      items.map((_, i) => [
        `${colors.gray(String(i).padStart(width))}`,
        `${colors.dim(':')}`,
        `${typed(_)}`,
      ].join(''))
    )
  else {
    const out = items.
      slice(0, 2).
      map((_, i) => [
        `${colors.gray(String(i).padStart(width))}`,
        `${colors.dim(':')} `,
        `${typed(_)}`,
      ].join(''))
    
    out.push(`${colors.dim(`${' '.padStart(width)}  ...`)}`)

    return output.concat(
      out.concat(items.
        slice(items.length - 2, items.length).
        map((_, i) => [
          `${colors.gray(String(i + (items.length - 2)).padStart(width))}`,
          `${colors.dim(':')} `,
          `${typed(_)}`,
        ].join(''))
      )
    )
  }
}

export const obj = (data: unknown) => {
  const name = data!.constructor.name === 'Object' ?
    'object literal'
    :
    data!.constructor.name

  const output = [`${colors.green(name)}`],
        width  = Object.keys(data!).reduce((w, c) => c.length > w ? c.length : w, 0)

  for (const [k, v] of Object.entries(data!)) {
    output.push(`${colors.white(k.padStart(width))}${colors.dim(':')} ${typed(v)}`)
  }

  return output
}

export const typed = (value: unknown) => {
  switch(typeof value) {
    case 'string': return `${colors.white(value)}`
    case 'bigint':
    case 'number':
      if (String(value).includes('.'))
        return `${colors.yellowBright(String(value))}`
      else return `${colors.yellowBright(String(value))}`
    case 'object':
      if (value === null) return `${colors.blue(String(value))}`
      else if (Array.isArray(value)) return arr(value)
      else return obj(value)
    case 'undefined':
    case 'boolean': return `${colors.blue(String(value))}`
    case 'function':
      return func(value.constructor.name, (value as WrappedFunction)._wrapped)
  }
}

export const format = (message: string, details: Array<Detail>) => {
  const _ = [`🚨 ${label('  Error ')} ${error(message)}`]
  
  _.push(seperator)

  for (const d of details) {
    _.push(`${key('Mädūl')} ${madul(d.madul)}`)
    _.push(`${key(  'fun')} ${fun  (d.fun  )} ${dim('line')} ${line(d.line )}`)

    const n = Object.keys(d.params).length === 1 ? '  param' : ' params'
    let index = 0

    for (const [k, v] of Object.entries(d.params)) {
      if (index++ === 0) _.push(`${key(n)} ${name(k)}${dim(':')} ${typed(v as string)}`)
      else               _.push(`${key( )} ${name(k)}${dim(':')} ${typed(v as string)}`)
    }

    _.push(seperator)
  }

  return _.join('\n')
}