import madul from "#Bootstrap"

import { AsyncInput } from "#types"

export const dependencies = () => ({
  'node:os!': ['tmpdir']
})

export const env = async () => {
  const config = await madul('!madul.config')

  return {
    current: process.env.NODE_ENV,
    root:    process.cwd(),
    ...(typeof config.env === 'function' ? await config.env() : {}),
  }
}

export interface ReportInput extends AsyncInput {
  tmpdir: CallableFunction
}

export const report = async ({ tmpdir }: ReportInput) => {
  const config = await madul('!madul.config'),
        root   = tmpdir()

  return {
    development: `${root}/development.report`,
    production:  `${root}/production.report`,
    test:        `${root}/test.report`,
    ...(typeof config.report === 'function' ? await config.report() : {}),
  }
}

export const debug = async () => {
  const config = await madul('!madul.config')

  return {
    development: (value: string) => console.info(value),
    production:  (_:     string) => {},
    ...(typeof config.debug === 'function' ? await config.debug() : {}),
  }
}