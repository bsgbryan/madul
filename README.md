# Madul

#### tl;dr

```js
import Module from 'madul'

class Caller extends Module {

  deps: [ 'fs', 'dance', 'drink', 'phone' ]

  $go_to_club(done) {
    const self = this

    self.dance()
    .then(() => self.drink())
    .then(done)
  }

  maybe(person, done, fail) {
    const self = this

    self.fs.readFile('contacts', 'utf8', (err, numbers) => {
      if (numbers.split('\n').includes(person)) {
        self.phone.dial(person).then(done)
      } else {
        fail("There's always next Friday ...")
      }
    })
  }
}
```

# What is madul?

`Madul` is a simpe, fun, testable way to write performant, maintainable, async code.

## Overview

There are several benefits to `Madul`:

1. _maduls are highly testable_ - dependency loading and initialization are handled by `Madul`. Dependencies are attached to a madul as properties, making them very easy to swap out for testing.
2. _async dependency support_ - `require` only works synchronously and AMD adds a lot of boilerplate. `Madul` supports both sync and async depencnedy loading via a single, boilerplateless mechanism (specifying dependencies as an array of strings to the `deps` property).
3. _simple, unobtrusive async behavior_ - `Madul` takes all the work out of making methods async. All methods that don't start with an underscore (`_`) are wrapped in a Promise (methods that start with a `$` are 'initializers' and executing during initialization). Async callbacks for success/completion, error/failure, and update/progress states are passed as the last three arguments to all wrapped methods.
4. _logging made easy_ - `Madul` handles logging via [EventEmitter2](https://github.com/asyncly/EventEmitter2 "GitHub page") and events. More on that below ...
5. _clean, understandable, fast code_ - All the pieces of `Madul` come together to produce code that is compact, easy-to-understand, fun to write, easy to test, easy to monitor, and performant as runtime.

## Logging

Logging deserves special attention as it may seem a bit odd at first.

`Madul` has no direct support for logging. Instead, `Madul` provides a simple mechanism to fire and consume events. Logging is just one way to handle consumed events.

### Example

```js
import Madul from 'madul'

Madul.LISTEN('**', (...args_passed_to_FIRE) => {
  console.log(this.event, args_passed_to_FIRE)
})
```

The above will log all events to the console.

## Events

There are three distinct types of events `Madul` supports:

+ `$` - _These are internal events intended to be used by `Madul` for debugging. `Madul` lifecycle events (initialization, dependency registration, etc) are of this type._
+ `!` - _These are error events._
+ `@` - _These are madul instance events. They are fired by `Madul` when a method is invoked and when callback methods (success/completion, error/failure, update/progress) are executed. They are also the event type fired when a modul calls the `fire` method._

The format for an event name is as follows:

```
{type}.{Madul class name}.{lifecycle stage/method name}.{lifecycle stage/additional specifiers}
```

### Examples

Some example event names are:

+ `$.DB.request_instance`   _fired whenever `new DB().initialize()` is called_
+ `!.DB.connection.failure` _fired if the DB cannot be connected to_
+ `@.DB.get_id.invoke`      _fired when `self.db.get_id()` is called_
+ `@.DB.get_id.resolve`     _fired when `self.db.get_id()` successfully completes_

### Events API

There are two global event API methods:

1. `Madul.LISTEN(event_name, callback)` - _This static method allows you to specify any event you'd like to consome, across all maduls._
2. `Madul.FIRE(event_name, args)` - _This is the static method used to actually fire events. It is not recommended to call this method directly. This method does not enfore any formatting rules for event names - meaning you may fire events that are not consumable as they do not follow the `Madul` event naming conventions._

Additionally, there are three instance level event API methods:

1. `listen(event_name, callback)` - _This method is a convenience wrapper limiting the scope of the `Madul.LISTEN` method to just your madul's events._
2. `fire(event_name, args)` - _This method wraps `Madul.FIRE`, properly formatting the event name to specify it as a madul event type - this guarantees `listen` will work as expected._
3. `warn(event_name, details)` - _This method fires a madul-level error event._

#### Example

To configure a madul to log its events to the console you'd do the following:

```js
import Madul from 'madul'

class Example extends Madul {
  $setup_logging_for_everthing(done) {
    // This will send any event for Example to the console
    this.listen('*', () => console.log(this.event, arguments))

    // Invoking async callbacks is not required, but it is good practice
    done()
  }

  $setup_just_invocation_logging(done) {
    // This will only send invoke events to the console
    this.listen('*.invoke', (arg) => console.log(`${this.event}(${arg})`))
    // Output would look like: @.Example.do_somthing.invoke(example arg)

    done()
  }

  do_somthing(arg, done, fail, update) {
    // Do things
    done()
  }

  do_something_else(done, fail) {
    // DO ALL THE THINGS
    done()
  }
}
```

## Dependencies

Dependencies are specified as an array of strings assigned to the `deps` property.

Dependencies that live in the project are specified in exactly the same way as third party and core node dependencies. Dependencies that load sync and async are specified in exactly the same way - `Madul` figures out which is what and handles things appropriately.

Once loaded, dependencies are added to the madul instance as properties. Any dashes in dependency names are converted to underscores (`_`).

### Example

Specifying and using dependencies is done as follows:

```js
import Madul from 'madul'

class AllTheDeps extends Madul {

  deps: [
    'fs',           // Core node module, loads sync
    'uuid-1345',    // Third party module, loads sync
    'single-ladies' // Project dependency - is a Madul, loads async
  ]

  // State callbacks can be called whatever makes the most sense
  foo(put_a_ring_on_it, play_cod) {
    const self = this // Important to maintain context in async callbacks

    self.fs.readFile('soul_mate.txt', 'utf8', (err, person) => {
      if (self.single_ladies.include(person)) {
        put_a_ring_on_it(person)
      }
    })
  }
}
```

## Bugs/feature requests

If you fix a bug - thank you! :heart_eyes: Please fork the repo, create a test, fix the bug, and submit a pull request.

If you find a bug feel free to open an issue - and please provide as much info as possible :blush:

Feature requests can be submitted as issues too.

## Contributing

Contributions are welcome and appreciated! :metal: Please just fork, code, get passing tests, and create a pull request.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
