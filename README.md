# Mädūl

Madul is a simple set of tools that help you craft clean async code that scales ridiculously well, is fun to write & maintain, and is super simple to instrument

### Super-quick overview

```js
const madul = {
  deps: ['moment', '/db'],
  $init: async function({ username, done }) {
    await this.db.connectAs({ username })

    done()
  },
  query: async function({ timestamp, friend, done }) {
    const allMessages  = await this.db.getAllMessagesBefore({ timestamp })
    const fromMyFriend = await this.db.getMessagesFrom({ friend })

    done(sdk.iterable(messages).filter(message =>
      fromMyFriend.includes(message)
    ))
  }
}

exports = madul
```

##### In the above code:

1. We define and export a plain old Node.js module
1. The `moment` and `db` (_a file local to the project, denoted by the `/`_) dependencies are loaded asynchronously
1. The `$init` method is guaranteed to be executed after `madul` has fully loaded, but before it's available for use; so you know that the `db` dependency will be properly setup and connected to
1. We have a nice, consistent way to define and deal with `async` behavior without being bound by the strict flow rules of `async/await`. (_The `done` callback lets us "return" from our functions in a more Promise-like way, which can be super convenient, without have to add any Promise-related cruft to our code_)

### Bugs/feature requests

If you fix a bug - thank you! :heart_eyes: Please fork the repo, create a test, fix the bug, and submit a pull request.

If you find a bug feel free to open an issue - and please provide as much info as possible :blush:

Feature requests can be submitted as issues too.

### Contributing

Contributions are welcome and appreciated! :metal: Please just fork, code, get passing tests, and create a pull request.

# There's more, much more

But it'll take me a bit to write up the docs.

More coming soon, _promise_! 😏

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
