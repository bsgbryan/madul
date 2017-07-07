# Madul

## TL;DR

### PLEASE NOTE

Madul is written in and intended to be used in [CoffeeScript](http://coffeescript.org/).

### Installation

```
npm install --save madul
```

### Usage

```coffeescript
import Module from 'madul'

class Caller extends Module

  # Can be core node modules, third party modules, or project files
  deps: [ 'fs', 'dance', 'drink', 'phone' ]

  # $ methods are all executed exactly once during madul initialization
  $go_to_club: (done) ->
    @dance()
    .then => @drink()
    .then done

  # All methods not starting with an underscore are wrapped, with
  # state callbacks passed as the last arguments to all invocations
  maybe: (person, done, fail) ->
    # Items in the deps array get assigned as instance properties
    @fs.readFile 'contacts', 'utf8', (err, numbers) =>
      if numbers.split('\n').includes person
        self.phone.dial(person).then done
      else
        fail "There's always next Friday ..."
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

```coffeescript
import Madul from 'madul'

Madul.LISTEN '**', (...args_passed_to_FIRE) =>
  console.log(@event, args_passed_to_FIRE)
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

```coffeescript
import Madul from 'madul'

class Example extends Madul
  $setup_logging_for_everthing: (done) ->
    # This will send any event for Example to the console
    @listen '**', => console.log this.event, arguments

    # Invoking state callbacks is not required, but it is good practice
    done()

  $setup_just_invocation_logging: (done) ->
    # This will only send invoke events to the console
    @listen '*.invoke', (arg) => console.log "#{this.event}(#{arg})"
    # Output would look like: @.Example.do_somthing.invoke(example arg)
    # NOTE: This would not log resolve, reject, or update events

    done()

  do_something: (arg, done, fail, update) ->
    # Do things
    @fire 'did_something.awesome', arg
    done()

  do_something_else: (done, fail) ->
    # DO ALL THE THINGS
    done()
```

## Dependencies

There's a bit to go over when it comes to dependencies.

Dependencies are specified using strings formatted to a spec: the `dependency_spec`. A `dependency_spec` has several properties:

* `search_root` Specifies the root of the file path to search when loading a dependency.
* `name` The actual name of the dependency. For a core node module or thrid party module it's the argument passed to `require`.
* `alias` A more convenient/meaningful way to refer to a dependency.
* `initializer` The method to execute when the dependency has been hydrated.
* `prerequisites` A list of other dependencies that must be hydrated and initialized before executing a dependency's `initializer`.

Aside from `name` all spec properties are optional.

An example of a `dependency_spec` with all properties would look like this: `example#dependency -> dep = configure:other_dep,even_more`.

Let's step through each property.

### `search_root`

The `search_root` precedes the `#` symbol in the example above. Maduls specify a search root to make loading files other than `index.js` ro whatever is specified as `main` in `package.json` easy.

A Madul specifies a search root like so (_in `index.js`_):

```coffeescript
Madul = require 'madul'

Madul.SEARCH_ROOT 'example', require.resolve '.'

class Example extends Madul

  # Madul deps and methods

module.exports = Example
```

Then, alongside `Example`, if there were a file named `something_cool.js` with the following contents:

```coffeescript
Madul = require 'madul'

class SomethingCool extends Madul

  # Madul deps and methods

module.exports = SomethingCool
```

Another Madul would then specify it's dependency on `SomethingCool` as follows:

```coffeescript
Madul = require 'madul'

class Foo extends Madul

  deps: [ 'fs', 'path', 'example#something_cool' ]

  # Madul methods

module.exports = Foo
```

Dependencies are hydrated by recursively searching all files and folders in a search root - so you can structure you're Maduls however you'd like. To load them, client code only needs to know the file name of the Madul they actually want to load.

### `alias`

An alias is a more convenient/meaningful way to refer to a dependency. If an `alias` is specified, it is the only way to refer to the dependency in code.

```coffeescript
Madul = require 'madul'

class Foo extends Madul

  deps: [ 'example -> ex' ]

  do_something: (done) ->
    @ex.foo() # Cannot use example for this dep, since it was given an alias
      .then done

module.exports = Foo
```

### `initializer`

A dependency `initializer` in a `dependency_spec` specifies the method on the dependant Madul to be invoked when the dependency has been hydrated.

```coffeescript
Madul = require 'madul'

class Bar extends Madul

  deps: [ 'example = configure' ]

  configure: (done) ->
    # Gets called automatically after example has been hydrated

module.exports = Bar
```

A dependency `initializer` is just a plain old Madul method.

### `prerequisites`

`preqrequisites` is a comma-seperated list of dependendies that must be ready to use before calling a dependency `initializer` - specifically the prerequisites' `initializer`(s) must be called before it's `initializer` executes.

```coffeescript
Madul = require 'madul'

class Baz extends Madul

  deps: [ 'example = configure:args', 'arguments -> args = load_args' ]

  load_args: (done) ->
    # Do whatever needs to be done

  configure: (done) ->
    # CONFIGURE ALL THE THINGS

module.exports = Baz
```

The order of execution above would be:

1. Hydrate `example` and `arguments` in parallel.
2. Execute `Baz.load_args`
3. Execute `Baz.configure`

## Initialization in depth

Calling `new` on a Madul class is not enough to get it into a usable state. Since constructors are synchronous Madul implements all its heavy lifting in the `initialize` method.

You will never need to override the initialize method. `$` initializer methods exist specifically to save you from overriding `initialize`.

The steps to get a usable madul are detailed below:

```coffeescript
import Example from './example'

new Example()                # 1
  .initialize()              # 2
  .then (madul) ->           # 3
    madul.execute_behavior() # 4
      .then (output) ->
        # Do something else
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
