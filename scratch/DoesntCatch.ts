import { type WrappedFunction } from "#types"

export const dependencies = () => ({
  '+Throws': ['ohboy']
})

export const letsBLOW = ({ ohboy }: { ohboy: WrappedFunction }) => {
  ohboy({
    baz: 'bang',
    boom: 42,
    arg: {
      bam: 'fom',
      biz: false,
      odd: [
        'tom',
        'tim',
        'tam',
        'tym',
        'tem',
      ],
      oof: {
        eek: 'yikes'
      }
    },
    aaa: 'oh, ok',
    fun: () => {},
    yay: [0, 1, 2, 3, 4, 5 ,6 ,7, 8, 9, 10]
  })
}