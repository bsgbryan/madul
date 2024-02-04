import { Input } from "#types"

export const env = () => ({
  current: process.env.NODE_ENV || 'development',
  root:    process.cwd(),
})

export const report = ({ self }: Input) => ({
  development: `${self!.env().root}/.madul/development.report`,
  production:  `${self!.env().root}/.madul/production.report`,
  test:        `${self!.env().root}/.madul/test.report`,
})