type PrintMeBabyInput = {
  print: CallableFunction
}

export const printMeBaby = ({ print }: PrintMeBabyInput) => {
  print({ o: 'hai!' })
}