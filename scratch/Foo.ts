export const dependancies = () => ({
  '+/Bar': ['boom']
})

type OHAIParams = {
  boom: CallableFunction
  person: string
}

export const ohai = ({ person, boom }: OHAIParams) => {
  return `OHAI, ${person}! ... ${boom()}`
}

export const asink = async () => Promise.resolve()