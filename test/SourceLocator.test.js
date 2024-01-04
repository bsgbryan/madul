const {
  find,
  recurse,
  fromCWD,
  fromNodeModules,
} = require('../lib/SourceLocator')

describe('SourceLocator', () => {
  describe('fromNodeModules', () => {
    it('is a function', () =>
      expect(fromNodeModules).to.be.a('function')
    )

    it('returns the path to the main source for a node module', async () => {
      const cwd  = process.cwd()
      const path = `${cwd}/node_modules/chai/./index`

      expect(await fromNodeModules('chai', cwd)).to.equal(path)
    })
  })

  describe('find', () => {
    it('is a function', () =>
      expect(find).to.be.a('function')
    )

    it('returns the path to the passed ref if one of found', async () => {
      const found = await find(`${process.cwd()}/scratch`, 'example')
      
      expect(found).to.equal(`${process.cwd()}/scratch/example.js`)
    })

    it('returns undefined when no match for the passed ref is found', async () => {
      const found = await find(`${process.cwd()}/lib`, 'example')
      
      expect(found).to.be.undefined
    })
  })

  describe('recurse', () => {
    it('is a function', () =>
      expect(recurse).to.be.a('function')
    )

    it('returns an array of directories to search beneath the passed path', async () => {
      const dirs = await recurse(process.cwd())

      expect(dirs.length).to.equal(3)
      expect(dirs[0]).to.equal(`${process.cwd()}/lib`)
      expect(dirs[1]).to.equal(`${process.cwd()}/scratch`)
    })
  })

  describe('fromCWD', () => {
    it('is a function', () =>
      expect(fromCWD).to.be.a('function')
    )

    it('returns the path the the file passed as ref', async () => {
      const path = await fromCWD('example', process.cwd())

      expect(path).to.equal(`${process.cwd()}/scratch/example.js`)
    })
  })
})