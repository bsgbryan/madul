import colors from "ansi-colors"

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
      name  = colors.whiteBright,
      str   = colors.whiteBright

const seperator = dim('---==========---'),
      key       = (text = '') => `   ${label(`${text.padStart(7)} `)}`

export const format = (message: string, details: Array<Detail>) => {
  const _ = [`🚨 ${label('  Error ')} ${error(message)}`]
  
  _.push(seperator)

  for (const d of details) {
    _.push(`${key('Mädūl')} ${madul(d.madul)}`)
    _.push(`${key(  'fun')} ${fun  (d.fun  )} ${dim('line')} ${line(d.line )}`)

    const n = Object.keys(d.params).length === 1 ? '  param' : ' params'
    let index = 0

    for (const [k, v] of Object.entries(d.params)) {
      if (index++ === 0) _.push(`${key(n)} ${name(k)}${dim(':')} ${str(v as string)}`)
      else               _.push(`${key( )} ${name(k)}${dim(':')} ${str(v as string)}`)
    }

    _.push(seperator)
  }

  return _.join('\n')
}