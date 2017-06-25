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

        input.done   = (out) => res 'resolve', out
        input.fail   = (err) => res 'reject',  err
        input.update = (out) => res 'notify',  out

        proto._report proto.constructor.name, method, 'invoke', id, input

        input

      _result: (results) =>
        succeeded = true
        reason    = undefined

        modifiers = for result in results
          if result.state != 'fulfilled'
            succeeded = false
            reason result.reason
          else
            result.value

        out = succeeded: succeeded

        if succeeded
          out.modifiers = modifiers
        else
          out.reason = reason

        out

      _do_wrap: (proto, method) =>
        if method != 'fire' && method != 'warn' && method != 'listen'
          Madul.FIRE "$.#{proto.constructor.name}.#{method}.wrap"

          console.log method, 'is a', typeof proto[method]

          if typeof proto[method] == 'function'
            proto["_#{method}"] = proto[method]

            proto[method] = =>
              def  = q.defer()
              args = if arguments[0]? then Array.prototype.slice.call arguments else [ ]

              proto["_#{method}"].apply @, proto._prep_invocation proto, method, args, def

              def.promise
          else if typeof proto[method] == 'object'
            decs = for own key, val of proto[method].validate
              val

            decs = decs.concat(proto[method].before) if proto[method].before?
            decs = decs.concat(proto[method].after)  if proto[method].after?

            console.log 'decorators', decs

            @_do_hydrate proto, decs, =>
              proto["_#{method}"] = proto[method]

              call_result = { }

              rejected = (results) =>
                output = @_result results

                if output.succeeded == false
                  def.reject output.reason

                output.succeeded == false

              proto[method] = =>
                def = q.defer()
                me  = proto["_#{method}"]

                args = if arguments[0]? then arguments else { }

                me.validate = { } unless me.validate?
                me.before   = [ ] unless me.before?
                me.after    = [ ] unless me.after?

                validators = for own key, val of me.validate
                  proto[val].EXECUTE args[key]

                q.all validators
                .then (results) =>
                  return if rejected results

                  q.all me.before.map (b) => proto[b].before args
                .then (results) =>
                  return if rejected results

                  output = @_result results
                  input  = @_prep_invocation method, args, def

                  if output.modifiers.length > 0
                    for mod in output.modifiers
                      for key, val of mod
                        input[key] = val

                  me.behavior.apply @, input
                .then (result) =>
                  call_result = result

                  q.all me.after.map (b) => b.after result
                .then (results) =>
                  return if rejected results

                  output = @_result results

                  if output.modifiers.length > 0
                    for mod in output.modifiers
                      for key, val of mod
                        call_result[key] = val

                  def.resolve call_result

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

      _load: (me, name, path, loaded) =>
        mod = require path

        if typeof mod == 'function'
          new mod name
            .initialize @ctor_params?[name]
            .then (mod) =>
              me._make_available name, mod
              loaded()
        else
          me._make_available name, mod
          loaded()

      _check: (me, path, dep, finished) =>
        fs.readdir path, (err, files) =>
          if err?
            me.warn 'file-not-found', err

            done type: 'ERROR', info: err
          else
            async.each files, (f, next) =>
              depth = "#{path}/#{f}"

              fs.stat depth, (e, s) =>
                if s.isDirectory() && f[0] != '.'
                  me._check me, depth, dep, next
                else if s.isFile() && f.substring(0, f.length - 3) == dep
                  me._load me, f.substring(0, f.length - 3), depth, => me._do_add me, dep, next
                else
                  next()
            , finished

      _add_dependency: (me, name, mod) =>
        Madul.FIRE "$.#{me.constructor.name}.dependency.register", name

        me[underscore name] = mod

      _do_add: (me, name, next) =>
        me._add_dependency me, name, available[strip name]
        next()

      _add: (me, name, resource, next) =>
        me._make_available name, require resource
        me._do_add me, name, next

      _do_hydrate: (proto, deps, callback) =>
        async.each deps, (d, next) =>
          if proto[underscore d]? == false
            if available[strip d]? == true
              proto._do_add proto, d, next
            else
              try
                proto._add proto, d, d, next
              catch e
                cwd = process.cwd()
                pkg = "#{cwd}/node_modules/#{d}/package.json"

                fs.stat pkg, (err, stat) =>
                  if stat?.isFile()
                    fs.readFile pkg, 'utf8', (err, data) =>
                      json = JSON.parse data
                      main = json.main || json._main || 'index.js'

                      proto._add proto, d, "#{cwd}/node_modules/#{d}/#{main}", next
                  else
                    proto._check proto, "#{cwd}/#{code_root}", d, next
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
