export const dependencies = () => ({
  '+DefaultExport': ['OhYeahBaby']
})

type ICanHazInput = {
  OhYeahBaby: CallableFunction
}

export const iCanHazDefaultExport = ({ OhYeahBaby }: ICanHazInput) => {
  return { OhYeahBaby }
}