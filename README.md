# Madul

### tl;dr

```coffeescript
import Module from 'madul'

class Caller extends Module

  deps: [ 'fs', 'phone' ] # Dependencies (can be 3rd party or peer modules)
  pub:  [ 'maybe' ]       # Public API methods (get wrapped in magic)

  maybe: (person) =>
    @fs.readFile 'contacts', 'utf8', (err, numbers) =>
      if numbers.split('\n').includes person
        @phone.call person
          .then => @done()
      else
        @fail "There's always next Friday ..."
```

## What is madul?

_Coming soon_
