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
        pre    = ''.padStart(indent)

  for (const [k, v] of Object.entries(data!)) {
    output.push(`${left} ${pre}${colors.white(k)}${colors.dim(':')} ${typed(v, left, indent, step)}`)
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
        return `${colors.magentaBright(String(value))}`
      else return `${colors.magentaBright(String(value))}`
    case 'object':
      if (value === null) return `${colors.blueBright(String(value))}`
      else if (Array.isArray(value)) return arr(value, left, indent, step)
      else return obj(value, left, indent + step, step)
    case 'undefined':
    case 'boolean': return `${colors.blueBright(String(value))}`
    case 'function':
      return func(value.constructor.name, (value as WrappedFunction)._wrapped)
    default: return ''
  }
}

const dim   = colors.dim,
      fun   = colors.bold.whiteBright,
      line  = colors.magentaBright,
      madul = colors.bold.cyanBright,
      name  = colors.whiteBright

const seperator = dim('---=========---')

const error  = colors.redBright,
      eLabel = colors.bgRedBright.whiteBright,
      eParam = colors.bgRed.whiteBright

const eKey = (text = '') => `   ${eLabel(`${text.padStart(8)} `)}`,
      eArg = (text = '') => `   ${eParam(`${text.padStart(8)} `)}`

export const formatErrMessage = (value: string) =>
  `🚨 ${eLabel('   Error ')} ${error(value)}\n`

export const formatErrDetails = (
  state: {
    context?: Detail
    param?:   Array<Detail>
    params?:  Array<Detail>
  }
) => {
  const _ = [seperator]
  const details = state.params ? state.params : state.param

  for (const d of details!) {
    _.push(`${eKey('Mädūl')} ${madul(d.madul)}`)
    _.push(`${eKey(  'fun')} ${fun  (d.fun  )} ${dim('line')} ${line(String(d.line))}`)

    let index = 0
    
    if (state.context?.madul === d.madul &&
      state.context?.fun   === d.fun   &&
      state.context?.line  === d.line
      ) {
      for (const [k, v] of Object.entries(state.context.params)) {
        const _k = eArg(index++ === 0 ? 'context' : undefined)
  
        _.push(`${_k} ${name(k)}${dim(':')} ${typed(v as string, eArg())}`)
      }
    }

    index = 0
    
    const key = Object.keys(d.params).length > 1 ? 'params' : 'param'

    for (const [k, v] of Object.entries(d.params)) {
      const _k = eArg(index++ === 0 ? key : undefined)

      _.push(`${_k} ${name(k)}${dim(':')} ${typed(v as string, eArg())}`)
    }

    _.push(seperator)
  }

  return _.join('\n')
}

const dLabel = colors.bgBlueBright.whiteBright,
      dParam = colors.bgBlue.whiteBright

const dKey = (text = '') => `   ${dLabel(`${text.padStart(8)} `)}`,
      dArg = (text = '') => `   ${dParam(`${text.padStart(8)} `)}`

export const formatDebug = (
  details: Array<Detail>
) => {
  const _ = [`💡 ${dLabel('   Debug ')}`]
  
  _.push(seperator)

  for (const d of details) {
    _.push(`${dKey('Mädūl')} ${madul(d.madul)}`)
    _.push(`${dKey(  'fun')} ${fun  (d.fun  )} ${dim('line')} ${line(String(d.line))}`)

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