import { Input } from "#types"

export const dependencies = () => ({
  '@Config': ['env', 'debug']
})

interface PrintInput extends Input {
  debug: CallableFunction
  env:   CallableFunction
  value: unknown
}

export const print = async ({
  debug,
  env,
  value,
}: PrintInput) => {
  if ((await debug())[(await env()).current])
    console.log(value)
}