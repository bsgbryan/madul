import { formatDebug } from "#Context"

import { type Detail } from "#types"

export const report = () => ({
  development: `${process.cwd()}/.madul/development.report`,
  production:  `${process.cwd()}/.madul/production.report`,
  test:        `${process.cwd()}/.madul/test.report`,
})


export const env = () => ({
  current: 'test'
})

export const debug = () => ({
  test: (value: Array<Detail>) => console.debug(formatDebug(value))
})