import colors from "ansi-colors"

import {
  Detail,
  WrappedFunction,
} from "#types"

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

export const arr = (
  items: Array<unknown>,
  left:  string,
  indent = 0,
  step   = 2,
): string => {
  const width  = String(items.length).length,
        output = [`${colors.green('Array')}`],
        pre    = ''.padStart(indent + step)

  if (items.length <= 5)
    return output.concat(
      items.map((_, i) => [
        `${left} `,
        `${pre}${colors.gray(String(i).padStart(width))}`,
        `${colors.dim(':')} `,
        `${typed(_, left, indent + step, step)}`,
      ].join(''))
    ).join('\n')
  else {
    const out = items.
      slice(0, 2).
      map((_, i) => [
        `${left} `,
        `${pre}${colors.gray(String(i).padStart(width))}`,
        `${colors.dim(':')} `,
        `${typed(_, left, indent + step, step)}`,
      ].join(''))
    
    out.push(`${left} ${pre}${colors.dim(`${' '.padStart(width)}  ...`)}`)

    return output.concat(
      out.concat(items.
        slice(items.length - 2, items.length).
        map((_, i) => [
          `${left} `,
          `${pre}${colors.gray(String(i + (items.length - 2)).padStart(width))}`,
          `${colors.dim(':')} `,
          `${typed(_, left, indent + step, step)}`,
        ].join(''))
      )
    ).join('\n')
  }
}

export const obj = (
  data: unknown,
  left: string,
  indent = 0,
  step   = 2,
) => {
  const name = data!.constructor.name === 'Object' ?
    'object literal'
    :
    data!.constructor.name

  const output = [`${colors.green(name)}`],
        width  = Object.keys(data!).reduce((w, c) => c.length > w ? c.length : w, 0),
        pre    = ''.padStart(indent)

  for (const [k, v] of Object.entries(data!)) {
    output.push(`${left} ${pre}${colors.white(k.padStart(width))}${colors.dim(':')} ${typed(v, left, indent, step)}`)
  }

  return output.join('\n')
}

export const typed = (
  value: unknown,
  left   = '',
  indent = 0,
  step   = 2,
): string => {
  switch(typeof value) {
    case 'string': return `${colors.white(value)}`
    case 'bigint':
    case 'number':
      if (String(value).includes('.'))
        return `${colors.yellowBright(String(value))}`
      else return `${colors.yellowBright(String(value))}`
    case 'object':
      if (value === null) return `${colors.blue(String(value))}`
      else if (Array.isArray(value)) return arr(value, left, indent, step)
      else return obj(value, left, indent + step, step)
    case 'undefined':
    case 'boolean': return `${colors.blue(String(value))}`
    case 'function':
      return func(value.constructor.name, (value as WrappedFunction)._wrapped)
    default: return ''
  }
}

const dim   = colors.dim,
      fun   = colors.bold.whiteBright,
      line  = colors.yellowBright,
      madul = colors.bold.cyanBright,
      name  = colors.whiteBright

const seperator = dim('---========---')

const error  = colors.redBright,
      eLabel = colors.bgRedBright.whiteBright,
      eParam = colors.bgRed.whiteBright

const eKey = (text = '') => `   ${eLabel(`${text.padStart(7)} `)}`,
      eArg = (text = '') => `   ${eParam(`${text.padStart(7)} `)}`

export const formatErr = (
  message: string,
  details: Array<Detail>,
) => {
  const _ = [`🚨 ${eLabel('  Error ')} ${error(message)}`]
  
  _.push(seperator)

  for (const d of details) {
    _.push(`${eKey('Mädūl')} ${madul(d.madul)}`)
    _.push(`${eKey(  'fun')} ${fun  (d.fun  )} ${dim('line')} ${line(d.line )}`)

    const n = Object.keys(d.params).length === 1 ? '  param' : ' params'
    let index = 0

    for (const [k, v] of Object.entries(d.params)) {
      const _k = eArg(index++ === 0 ? n : undefined)

      _.push(`${_k} ${name(k)}${dim(':')} ${typed(v as string, eArg())}`)
    }

    _.push(seperator)
  }

  return _.join('\n')
}

const dLabel = colors.bgBlueBright.whiteBright,
      dParam = colors.bgBlue.whiteBright

const dKey = (text = '') => `   ${dLabel(`${text.padStart(7)} `)}`,
      dArg = (text = '') => `   ${dParam(`${text.padStart(7)} `)}`

export const formatDebug = (
  details: Array<Detail>
) => {
  const _ = [`💡 ${dLabel('  Debug ')}`]
  
  _.push(seperator)

  for (const d of details) {
    _.push(`${dKey('Mädūl')} ${madul(d.madul)}`)
    _.push(`${dKey(  'fun')} ${fun  (d.fun  )} ${dim('line')} ${line(d.line )}`)

    const n = Object.keys(d.params).length === 1 ? '  param' : ' params'
    let index = 0

    for (const [k, v] of Object.entries(d.params)) {
      const _k = dArg(index++ === 0 ? n : undefined)

      _.push(`${_k} ${name(k)}${dim(':')} ${typed(v as string, dArg())}`)
    }

    _.push(seperator)
  }

  return _.join('\n')
}