let called = false

const madul = {
  after: ({ done }) => {
    called = true
    
    done(true)
  },
  didRun: ({ done }) => done(called)
}