let called = false

exports = {
  after: ({ done }) => {
    called = true
    
    done(true)
  },
  didRun: ({ done }) => done(called)
}