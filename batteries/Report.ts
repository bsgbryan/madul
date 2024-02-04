import {
  AsyncAfterDecorator,
  AsyncBeforeDecorator,
  AsyncInput,
  ErrDecorator,
} from "#types"

let _file: string

export const dependencies = () => ({
  '@Config':           ['env',   'report'   ],
  'node:fs/promises!': ['mkdir', 'writeFile'],
  'node:path!':        ['dirname'           ],
})

export interface InitInput extends AsyncInput {
  dirname:   CallableFunction
  env:       CallableFunction
  mkdir:     CallableFunction
  report:    CallableFunction
  writeFile: CallableFunction
}

export const $init = async ({
  dirname,
  env,
  mkdir,
  report,
  writeFile,
}: InitInput) => {
  if (_file === undefined)
    _file = (await report())[(await env()).current]

  await mkdir(dirname(_file), { recursive: true })
  await writeFile(_file, '')
}

export const input = async ({
  input: _input
}: AsyncBeforeDecorator) => {
  // Do stuff
}

export const output = async ({
  output: _output
}: AsyncAfterDecorator) => {
  // Do stuff
}

export const err = async ({
  err: _err
}: ErrDecorator) => {
  // Do stuff
}