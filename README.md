# Mädūl

Madul is a simple set of tools that help you craft clean functional code that's straightforward to test - and fun to write & maintain

## tl;dr

### Madul Definition: `MessageReciever.ts`

```ts
export const dependencies = () => ({
  '+/db': ['connectAs', 'getAllMessagesBefore', 'getMessagesFrom']
})

export const $init = async ({ connectAs, username }) => await connectAs({ username })

export const getMessagesFrom = async ({
  friend,
  getAllMessagesBefore,
  getMessagesFrom,
  sentBefore,
}) => {
  const allMessages  = await getAllMessagesBefore({ timestamp: sentBefore })
  const fromMyFriend = await getMessagesFrom({ friend })

  return allMessages.filter(m => fromMyFriend.includes(m))
}
```

#### In the above code:

1. A madul is just a plain old node module
1. The `db` dependency is loaded asynchronously
1. Dependencies are passed as named parameters to methods
1. The `$init` method is guaranteed to be executed after all dependencies have been loaded, but before the madul is available for use; so you know that the `db` will be properly setup and connected to as `username`
1. `sdk` is a collection of helpful functions. The [iterable sdk](https://github.com/bsgbryan/madul/blob/master/sdk/Iterable.js) wraps the [async](https://www.npmjs.com/package/async) library. `sdk` is easily configurable/customizable per madul.

### Madul Usage `GetMessagesFromAda.ts`

```ts
import madul from '@bsgbryan/madul'

const receiver = await madul('+/MessageReciever', { username: 'KatherineJohnson' })

const oneHour    = 1000 * 60 * 60
const sentBefore = Date.now() - oneHour

const messages = await receiver.getMessagesFrom({ friend: 'Ada', sentBefore })

console.log('My messages from Ada!', messages)
```

#### In the above code:

1. We pass the `username` used for connecting to the `db` when creating our `madul`
1. We don't call `$init` directly; that's handled for us as part of `madul`
1. We don't pass the `db` dependency to `getMessagesFrom`; that's handled for us
