# Mädūl

Madul is a simple set of tools that help you craft clean async code that scales ridiculously well, is fun to write & maintain, and is super simple to instrument

### Super-quick overview

##### definition (`getMessages.js`)
```js
const madul = {
  deps: ['/db'],
  $init: async ({ db, username }) =>
    await db.connectAs({ username })
  ,
  getMessagesFrom: async ({ friend, sentBefore, db }) => {
    const allMessages  = await db.getAllMessagesBefore({ timestamp: sentBefore })
    const fromMyFriend = await db.getMessagesFrom({ friend })

    const messagesFromMyFriend = sdk.
      iterable(allMessages).
      filter(m => fromMyFriend.includes(m))

    return messagesFromMyFriend
  }
}
```
###### In the above code:

1. A madul is just an object literal
1. The `db` (_a file local to the project, denoted by the `/`_) dependency is loaded asynchronously
1. Dependencies are passed as named parameters to methods
1. The `$init` method is guaranteed to be executed after `madul` has fully loaded, but before it's available for use; so you know that the `db` dependency will be properly setup and connected to as `username`
1. `sdk` is a collection of helpful functions. The [iterable sdk](https://github.com/bsgbryan/madul/blob/master/sdk/Iterable.js) wraps the [async](https://www.npmjs.com/package/async) library. `sdk` is easily configurable/customizable per madul.

##### usage (`getMessagesFromAda.js`)
```js
const bootstrap = require('@bsgbryan/madul/bootstrap')

const main = async () => {
  const messageGetter = await bootstrap('/getMessages', { username: 'KatherineJohnson' })
  
  const oneHour    = 1000 * 60 * 60
  const sentBefore = Date.now() - oneHour
  
  const messages = await messageGetter.getMessagesFrom({ friend: 'Ada', sentBefore })

  console.log('My messages from Ada!', messages)
}

main()
```

###### In the above code:

1. We pass the `username` used for connecting to the `db` to `bootstrap`
1. We don't call `$init` directly; that's handled for us as part of `bootstrap`
1. We don't pass the `db` dependency to `getMessagesFrom`; that's handled for us
1. `main` is necessary here because Node.js doesn't [support](https://dev.to/mikeesto/top-level-await-in-node-2jad) top level `await` in _non_-ES modules
