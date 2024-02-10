import { exists } from "node:fs/promises"
import { tmpdir } from "node:os"

import { formatDebug } from "#Context"

import { Detail } from "#types"

const madconfig = `${process.cwd()}/madul.config.ts`

export const env = async () => {
  const base = {
    current: process.env.NODE_ENV,
    root:    process.cwd(),
  }

  if (await exists(madconfig)) {
    const config = await import(madconfig)

    return {
      ...base,
      ...(typeof config.env === 'function' ? config.env() : {}),
    }
  }
  else return base
}

export const report = async () => {
  const root = tmpdir(),
        base   = {
          development: `${root}/development.report`,
          production:  `${root}/production.report`,
          test:        `${root}/test.report`,
        }

  if (await exists(madconfig)) {
    const config = await import(madconfig)

    return {
      ...base,
      ...(typeof config.report === 'function' ? config.report() : {}),
    }
  }
  else return base
}

export const debug = async () => {
  const noop = (_: Array<Detail>) => {},
        base = {
          development: (value: Array<Detail>) => console.debug(formatDebug(value)),
          production:  noop,
          test:        noop,
        }

  if (await exists(madconfig)) {
    const config = await import(madconfig);

    return {
      ...base,
      ...(typeof config.debug === 'function' ? config.debug() : {}),
    }
  }
  else return base
}