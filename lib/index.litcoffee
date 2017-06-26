    q     = require 'q'
    fs    = require 'fs'
    async = require 'async'
    uuid  = require 'uuid-1345'

    microtime = require 'microtime'

    EventEmitter2 = require('eventemitter2').EventEmitter2
    emitter       = new EventEmitter2 wildcard: true

    available   = { }
    initialized = { }
    listeners   = { }

    code_root = process.env.MADUL_ROOT || 'dist'

    underscore = (value) -> value.replace /\W+/g, '_'
    strip      = (name)  -> name.toLowerCase().replace /\W+/g, ''

    WRAPPED = { }

    _INITIALIZERS = { }

    INITIALIZERS = (cls, method) ->
      _INITIALIZERS[cls] = [ ] unless _INITIALIZERS[cls]?

      _INITIALIZERS[cls].push fn: method, called: false

    WRAP = (cls, method) ->
      unless WRAPPED[cls]?
        WRAPPED[cls] = [
          'constructor'
          'initialize'
          'details'
        ]

      WRAPPED[cls].indexOf(method) < 0

    class Madul

      details: =>
        name  = @.__proto__.constructor.name
        props = for own key, val of @.__proto__
          if key != 'constructor' &&
             key != 'details'     &&
             key != 'initialize'  && ((
               key[0]            == '_' &&
               @.__proto__[key]? == false
             ) || key[0] != '_')

            if typeof val == 'function'
              value = val.constructor.name
            else if Array.isArray val
              value = for v in val
                if typeof v == 'function'
                  v.constructor.name
                else if typeof v == 'object'
                  v.constructor.name
                else
                  v
              value = value.join ','
            else if typeof val == 'object'
              value = val.constructor.name
            else
              value = val

            "#{key} => #{value}"

        "\n  #{name}\n    #{props.filter((e) -> e?).join '\n    '}"

      @LISTEN: (event, callback) => emitter.on event, callback

      @FIRE: (event, args) => emitter.emit event, args

      listen: (event, callback) ->
        Madul.LISTEN "*.#{@constructor.name}.#{event}", callback

      fire: (event, args) ->
        Madul.FIRE "@.#{@constructor.name}.#{event}", args

      warn: (event, details) ->
        Madul.FIRE "!.#{@constructor.name}.#{event}", details

      _report: (name, method, state, id, args) =>
        Madul.FIRE "@.#{name}.#{method}.#{state}",
          uuid:      id
          args:      args
          timestamp: microtime.now()

      _respond: (proto, method, id, deferred) =>
        (state, data) =>
          process.nextTick =>
            deferred[state] data

            proto._report proto.constructor.name, method, state, id, data

      _prep_invocation: (proto, method, input, def) =>
        id  = uuid.v4fast()
        res = proto._respond proto, method, id, def

        if Array.isArray input
          input.push (out) => res 'resolve', out
          input.push (err) => res 'reject',  err
          input.push (out) => res 'notify',  out
        else if typeof input == 'object'
          input.done   = (out) => res 'resolve', out
          input.fail   = (err) => res 'reject',  err
          input.update = (out) => res 'notify',  out

          input = [ input ]
        else
          msg = "input to #{proto.constructor.name}.#{method} must be an Array of Object"
          @warn 'input.invalid', msg
          throw new Error msg

        proto._report proto.constructor.name, method, 'invoke', id, input

        input

      _do_wrap: (proto, method) =>
        if method != 'fire' && method != 'warn' && method != 'listen'
          Madul.FIRE "$.#{proto.constructor.name}.#{method}.wrap"

          if typeof proto[method] == 'function'
            proto["_#{method}"] = proto[method]

            proto[method] = =>
              def  = q.defer()
              args = if arguments[0]? then Array.prototype.slice.call arguments else [ ]

              proto["_#{method}"].apply @, proto._prep_invocation proto, method, args, def

              def.promise
          else if typeof proto[method] == 'object'

            if Array.isArray proto[method].validate
              args_format = 'ARRAY'
              decs        = for val in proto[method].validate
                val
            else if typeof proto[method].validate == 'object'
              args_format = 'OBJECT'
              decs        = for own key, val of proto[method].validate
                val
            else if typeof proto[method].validate == 'string'
              args_format = 'ARRAY'
              decs        = [ proto[method].validate ]
            else if typeof proto[method].validate != 'undefined'
              @warn 'meta.invalid', validate: 'must be a String, Object, or Array'
              return
            else
              args_format = 'ARRAY'
              decs        = [ ]

            decs = decs.concat(proto[method].before) if proto[method].before?
            decs = decs.concat(proto[method].after)  if proto[method].after?

            @_do_hydrate proto, decs, =>
              proto["_#{method}"] = proto[method]

              out = undefined

              proto[method] = =>
                def = q.defer()
                me  = proto["_#{method}"]

                if args_format == 'ARRAY'
                  args = Array.prototype.slice.call arguments

                  if me.validate?
                    validators = for val, i in me.validate
                      proto[val].EXECUTE args[i]
                else if args_format == 'OBJECT'
                  args = arguments[0]

                  if me.validate?
                    validators = for own key, val of me.validate
                      proto[val].EXECUTE args[key]
                else
                  @warn 'cannot-continue', 'No arg format specified'

                  return def.reject 'No arg format specified'

                me.before = [ ] unless me.before?
                me.after  = [ ] unless me.after?

                q.all validators
                .then => q.all me.before.map (b) => proto[b].before args
                .then =>
                  me.behavior.apply @, @_prep_invocation proto, method, args, def
                .then (result) =>
                  out = result
                  q.all me.after.map (b) => b.after out
                .then          => def.resolve out
                .catch   (err) => def.reject  err

                def.promise
          else
            @warn 'cannot-wrap', method

          WRAPPED[proto.constructor.name].push method

      _wrap_methods: =>
        proto = @.__proto__
        name  = proto.constructor.name

        while proto? && Object.keys(proto).length > 0 && WRAPPED[name]? == false
          for method, body of proto
            if method[0]                  != '_'         &&
               (
                typeof body.behavior       == 'function' ||
                typeof body                == 'function'
               ) &&
               typeof proto["_#{method}"] == 'undefined' &&
               WRAP(name, method)         == true

              proto._do_wrap proto, method

              INITIALIZERS name, method if method[0] == '$'

          proto = proto.__proto__

      _make_available: (name, mod) =>
        Madul.FIRE "$.#{name}.available"

        available[strip name] = mod

      _hydrate_deps: (done) =>
        proto  = @.__proto__
        protos = [ proto ]

        if proto.__proto__?
          while proto.__proto__? && Object.keys(proto.__proto__).length > 0
            protos.push proto = proto.__proto__

        async.each protos, (p, next) =>
          if p.deps?
            p._do_hydrate p, p.deps, next
          else
            next()
        , done

      _init_if_madul: (path, initer, callback) =>
        mod      = require path
        proto    = mod
        is_madul = false

        while proto
          is_madul = true if proto.constructor.name == 'Madul'

          proto = proto.__super__

        if is_madul
          new mod()
            .initialize()
            .then (mod) =>
              if initer?
                mod[initer]()
                  .then => callback mod
              else
                callback mod
        else
          callback mod

      _load: (me, name, initer, path, loaded) =>
        me._init_if_madul path, initer, (mod) =>
          me._make_available name, mod
          loaded()

      _check: (me, path, dep, ref, initer, finished) =>
        fs.readdir path, (err, files) =>
          if err?
            me.warn 'file-not-found', err

            done type: 'ERROR', info: err
          else
            async.each files, (f, next) =>
              depth = "#{path}/#{f}"

              fs.stat depth, (e, s) =>
                if s.isDirectory() && f[0] != '.'
                  me._check me, depth, dep, ref, initer, next
                else if s.isFile() && f.substring(0, f.length - 3) == dep
                  me._load me, ref, initer, depth, => me._do_add me, dep, ref, next
                else
                  next()
            , finished

      _add_dependency: (me, name, mod) =>
        Madul.FIRE "$.#{me.constructor.name}.dependency.register", name

        me[underscore name] = mod

      _do_add: (me, name, ref, next) =>
        me._add_dependency me, ref, available[strip name]
        next()

      _add: (me, name, ref, initer, path, next) =>
        me._init_if_madul path, initer, (mod) =>
          me._make_available name, mod
          me._do_add me, name, ref, next

      _do_hydrate: (proto, deps, callback) =>
        async.each deps, (d, next) =>
          name, alias, initer = undefined
          tokens = d.split '->'

          if tokens.length == 2
            alias = tokens[0]
            t     = tokens[1].split '::'

            if t.length == 2
              name   = t[0]
              initer = t[1]
            else
              name = t[0]
          else
            name = alias = tokens[0]

          ref = alias || name

          if proto[underscore ref]? == false
            if available[strip name]? == true
              proto._do_add proto, name, ref, next
            else
              try
                proto._add proto, name, ref, initer, d, next
              catch e
                cwd = process.cwd()
                pkg = "#{cwd}/node_modules/#{d}/package.json"

                fs.stat pkg, (err, stat) =>
                  if stat?.isFile()
                    fs.readFile pkg, 'utf8', (err, data) =>
                      json = JSON.parse data
                      main = json.main || json._main || 'index.js'
                      path = "#{cwd}/node_modules/#{d}/#{main}"

                      proto._add proto, name, ref, initer, path, next
                  else
                    proto._check proto, "#{cwd}/#{code_root}", d, ref, initer next
          else
            next()
        , callback

      _finish_up: (proto, args) =>
        name = proto.constructor.name

        @_call_initializers_for name, =>
          if listeners[name]?
            async.each listeners[name], (listener, next) =>
              listener @
              next()
            , => @_register_initialized name
          else
            @_register_initialized name

      _register_initialized: (name) =>
        @_make_available name, @

        initialized[name] = true

        Madul.FIRE "$.#{name}.initialized"

      _call_initializers_for: (name, callback) =>
        if _INITIALIZERS[name]?
          async.each _INITIALIZERS[name], (initializer, next) =>
            if initializer.called == false
              @[initializer.fn]()
                .then =>
                  initializer.called = true
                  next()
            else
              next()
          , callback
        else
          callback()

      _invoke_parent_initializers: (callback) =>
        proto = @.__proto__

        if proto.__proto__?
          parents = while proto.__proto__? && Object.keys(proto.__proto__).length > 0
            proto = proto.__proto__

          async.each parents, (parent, next) =>
            @_call_initializers_for parent.constructor.name, next
          , callback
        else
          callback()

      initialize: =>
        deferred = q.defer()
        proto    = @.__proto__
        name     = proto.constructor.name

        Madul.FIRE "$.#{name}.request_instance"

        if initialized[name] == undefined
          Madul.FIRE "$.#{name}.initialize"

          initialized[name] = false
          listeners[name]   = [ deferred.resolve ]

          @_wrap_methods()
          @_hydrate_deps => @_invoke_parent_initializers => @_finish_up proto
        else if initialized[name] == false
          listeners[name].push deferred.resolve
        else if initialized[name] == true
          process.nextTick => deferred.resolve available[strip name]

        deferred.promise

    module.exports = Madul
