import { WrappedFunction } from "#types"

export const dependencies = () => ({
  '+Throws': ['ohboy']
})

export const letsBLOW = ({ ohboy }: { ohboy: WrappedFunction }) => {
  ohboy({ baz: 'bang', boom: 42 })
}