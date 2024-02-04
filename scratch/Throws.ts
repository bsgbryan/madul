import err from "#Err"

export const ohboy = ({ err }: { err: typeof err }) => {
  err('BOOM')
}