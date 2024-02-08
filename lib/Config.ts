import { tmpdir } from "node:os"

import {
  env    as _env,
  debug  as _debug,
  report as _report,
} from "../madul.config"

import { formatDebug } from "#Context"

import { Detail } from "#types"

export const dependencies = () => ({
  '!madul.config': ['env', 'report', 'debug'],
})

export const env = () => ({
  current: process.env.NODE_ENV,
  root:    process.cwd(),
  ...(typeof _env === 'function' ? _env() : {}),
})

export const report = () => {
  const root = tmpdir()

  return {
    development: `${root}/development.report`,
    production:  `${root}/production.report`,
    test:        `${root}/test.report`,
    ...(typeof _report === 'function' ? _report() : {}),
  }
}

export const debug = () => ({
  development: (value: Array<Detail>) => console.debug(formatDebug(value)),
  production:  (_:     string) => {},
  ...(typeof _debug === 'function' ? _debug() : {}),
})