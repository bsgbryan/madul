import { Input } from "#types"

export const dependencies = () => ({
  '@Config': ['env']
})

interface ReportInput extends Input {
  env: CallableFunction
}

export const report = async ({ env }: ReportInput) => {
  const { root } = await env()

  return {
    development: `${root}/.madul/development.report`,
    production:  `${root}/.madul/production.report`,
    test:        `${root}/.madul/test.report`,
  }
}