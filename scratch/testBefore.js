let called = false

const madul = {
  before: ({ done }) => {
    called = true
    
    done(true)
  },
  didRun: ({ done }) => done(called)
}