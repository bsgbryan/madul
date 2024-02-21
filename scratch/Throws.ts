export type OhBoyErr = {
  context: {
    extra: string
  }
}

export const ohboy = ({ err }: { err: CallableFunction}) => {
  err('BOOM', { extra: 'info' })
}