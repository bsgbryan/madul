export const ohboy = ({ err }: { err: CallableFunction}) => {
  err('BOOM', { extra: 'info', whoa: 42, bing: { bang: 'boom', bop: false } })
}