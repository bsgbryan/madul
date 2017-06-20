# Madul

## TL;DR

### Installation

```
npm install --save madul
```

### Usage

```js
import Module from 'madul'

class Caller extends Module {

  // Can be core node modules, third party modules, or project files
  deps = [ 'fs', 'dance', 'drink', 'phone' ]

  // $ methods are all executed exactly once during madul initialization
  $go_to_club(done) {
    const self = this

    self.dance()
    .then(() => self.drink())
    .then(done)
  }

  // All methods not starting with an underscore are wrapped, with
  // state callbacks passed as the last arguments to all invocations
  maybe(person, done, fail) {
    const self = this

    // Items in the deps array get assigned as instance properties
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

Madul is a simpe, fun, testable way to write performant, maintainable, async code.

It's intended to be the base of an inheritence hierarchy - think: Object in Java.

## Overview

There are several benefits to Madul:

1. **Maduls are highly testable** :: Dependency loading and initialization are handled by Madul. Dependencies are attached to a madul as properties, making them very easy to swap out for testing.
2. **Async dependency support** :: `require` only works synchronously and AMD adds a lot of boilerplate. Madul supports both sync and async depencnedy loading via a single, boilerplateless mechanism (specifying dependencies as an array of strings to the `deps` property).
3. **Simple, unobtrusive async behavior** :: Madul takes all the work out of making methods async. All methods that don't start with an underscore are wrapped in a Promise (methods that start with a `$` are _'initializers'_ and executing during initialization). Callbacks for success/completion, error/failure, and update/progress states are passed as the last three arguments to all wrapped methods.
4. **Logging made easy** :: Madul handles logging via [EventEmitter2](https://github.com/asyncly/EventEmitter2 "GitHub page") and events. More on that below ...
5. **Clean, understandable, fast code** :: All the pieces of Madul come together to produce code that is compact, easy-to-understand, fun to write, easy to test, easy to monitor, and performant as runtime.

## Logging

Logging deserves special attention as it may seem a bit odd at first.

Madul has no direct support for logging. Instead, Madul provides a simple mechanism to fire and consume events. Logging is just one way to handle consumed events.

### Example

```js
import Madul from 'madul'

Madul.LISTEN('**', (...args_passed_to_FIRE) => {
  console.log(this.event, args_passed_to_FIRE)
})
```

The above will log all events to the console.

## Events

There are three distinct types of events Madul supports:

+ `$` = Internal events intended to be used by Madul for debugging. Madul lifecycle events (initialization, dependency registration, etc) are of this type.
+ `!` = Error events.
+ `@` = Madul instance events. They are fired by Madul when a method is invoked and when state callback methods (success/completion, error/failure, update/progress) are executed. They are also the event type fired when a madul calls its `fire` method.

The format for an event name is as follows:

```
{type}.{Madul class name}.{lifecycle stage/method name}.{lifecycle stage/additional specifiers}
```

### Examples

Some example event names (for a hypothetical DB madul) are:

+ `$.DB.request_instance`   fired whenever `new DB().initialize()` is called
+ `!.DB.connection.failure` fired if the DB cannot be connected to
+ `@.DB.get_id.invoke`      fired when `self.db.get_id()` is called
+ `@.DB.get_id.resolve`     fired when `self.db.get_id()` successfully completes

### Events API

There are two global event API methods:

1. `Madul.LISTEN(event_name, callback)` -> This static method allows you to specify any event you'd like to consume, across all maduls.
2. `Madul.FIRE(event_name, args)` -> This is the static method used to actually fire all events. **NOTE** This method does not enforce any formatting rules for event names - meaning you may fire events that are not consumable as they do not follow the Madul event naming conventions. _Please use this method carefully._

Additionally, there are three instance level event API methods. The `event_name` you pass to these methods is appended to the `@.{Madul class name}.` that gets passed to `Madul.LISTEN`/`Madul.FIRE`.

1. `listen(event_name, callback)` => This method is a convenience wrapper limiting the scope of the `Madul.LISTEN` method to just your maduls events.
2. `fire(event_name, args)` => This method wraps `Madul.FIRE`, properly formatting the event name to specify it as a madul-level event - guaranteeing `listen` will work as expected.
3. `warn(event_name, details)` => This method fires a madul-level error event.

**NOTE** Event names must me dot `.` delimited.

#### Built-in events

The following are all the built-in events:

+ `$.{Madul}.request_instance` Fired every time `new {Madul}().initialize()` is invoked
+ `$.{Madul}.initilize` Fired exactly once for a Madul - the first time `new {Madul}().initialize()` is invoked
+ `$.{Madul}.{method}.wrap` Fired once for each method as it gets wrapped
+ `$.{Madul}.dependency.register` Fired when a loaded dependency is added as a property to a madul
+ `$.{Madul}.initialized` Fired exactly once for a Madul; when it has been successfully initialized
+ `@.{Madul}.{method}.invoke` Fired every time a wrapped method is called
+ `@.{Madul}.{method}.resolve` Fired every time the `done` (_first_) state callback is invoked
+ `@.{Madul}.{method}.reject` Fired every time the `fail` (_second_) state callback in invoked
+ `@.{Madul}.{method}.update` Fired every time the `update` (_third_) state callback is invoked
+ `!.{Madul}.file-not-found` Fired if a dependency cannot be found during initialization

The `invoke`, `resolve`, `reject`, and `update` madul-level events all receive the following information:

+ `uuid` A universally unique identifier for the method invocation
+ `args` The arguments passed to the method invocation/state callback
+ `timestamp` A microsecond precision timestamp (represented as an integer) for when the event occured

#### User created events

You can create new madul-level event types simply by passing dot-delimited strings to `fire`.

You can also create entirely new global event types by passing dot-delimited strings to `Madul.FIRE`. _Please be very careful when doing this._

### Example

To configure a madul to log its events to the console you'd do the following:

```js
import Madul from 'madul'

class Example extends Madul {
  $setup_logging_for_everthing(done) {
    // This will send any event for Example to the console
    this.listen('**', () => console.log(this.event, arguments))

    // Invoking state callbacks is not required, but it is good practice
    done()
  }

  $setup_just_invocation_logging(done) {
    // This will only send invoke events to the console
    this.listen('*.invoke', (arg) => console.log(`${this.event}(${arg})`))
    // Output would look like: @.Example.do_somthing.invoke(example arg)
    // NOTE: This would not log resolve, reject, or update events

    done()
  }

  do_somthing(arg, done, fail, update) {
    // Do things
    this.fire('did_something.awesome', arg)
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

Dependencies are loaded in parallel.

Dependencies that live in the project are specified in exactly the same way as third party and core node dependencies. Dependencies that load sync and async are specified in exactly the same way - Madul figures out which is what and handles things appropriately.

Once loaded, dependencies are added to the madul instance as properties. Any dashes in dependency names are converted to underscores.

Keeping consistent with how `require` works dependencies are singlestons - each dependency is loaded exactly once. That instance is then given to all maduls that specify the dependency.

### Example

Specifying and using dependencies is done as follows:

```js
import Madul from 'madul'

class AllTheDeps extends Madul {

  deps = [
    'fs',           // Core node module, loads sync
    'uuid-1345',    // Third party module, loads sync
    'single-ladies' // Project dependency - is a Madul, loads async
  ]

  // State callbacks can be called whatever makes the most sense
  foo(put_a_ring_on_it, play_cod) {
    const self = this // Important to maintain context in state callbacks

    self.fs.readFile('soul_mate.txt', 'utf8', (err, bae) => {
      if (self.single_ladies.include(bae)) {
        put_a_ring_on_it(bae)
      }
    })
  }
}
```

## Initialization in depth

Calling `new` on a Madul class is not enough to get it into a usable state. Since constructors are synchronous Madul implements all its heavy lifting in the `initialize` method.

You will never need to override the initialize method. `$` initializer methods exist specifically to save you from overriding `initialize`.

The steps to get a usable madul are detailed below:

```js
import Example from './example'

new Example()                // 1
  .initialize()              // 2
  .then(madul => {           // 3
    madul.execute_behavior() // 4
      .then((output) => /* Do something else */)
  })
```

1. Madul constructors works just like any other constructor
2. `initialize` wires up all the dependencies, wraps all the methods, and executes `$` initializers
3. The fully baked, ready-to-use madul is passed to the `initialize().then` callback
4. All wrapped madul methods return a promise

**NOTE** A Madul is only initialized once. All subsequent calls to `initialize` after the first simply return the already-initialized instance.

You'll likely never see or need to worry about this, as it's all handled behind the scenes for you, but if you ever need to initialize a madul outside of the `deps` array this may come in handy.

## Bugs/feature requests

If you fix a bug - thank you! :heart_eyes: Please fork the repo, create a test, fix the bug, and submit a pull request.

If you find a bug feel free to open an issue - and please provide as much info as possible :blush:

Feature requests can be submitted as issues too.

## Contributing

Contributions are welcome and appreciated! :metal: Please just fork, code, get passing tests, and create a pull request.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
