let called = false

exports = {
  before: ({ done }) => {
    called = true
    
    done(true)
  },
  didRun: ({ done }) => done(called)
}