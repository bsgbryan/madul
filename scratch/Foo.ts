export const dependancies = () => ({
  '+/Bar': ['boom']
})

type OHAIParams = {
  person: string
}

export const ohai = ({ person }: OHAIParams) => {
  console.log(`OHAI, ${person}!`)
}

export const asink = async () => Promise.resolve()