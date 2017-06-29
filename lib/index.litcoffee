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

    code_root = process.env.SEARCH_ROOT || 'dist'

    underscore = (value) -> value.replace /\W+/g, '_'
    strip      = (name)  -> name.toLowerCase().replace /\W+/g, ''

    SEARCH_ROOTS  = { }
    WRAPPED       = { }
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

      @SEARCH_ROOT: (mod, path) =>
        Madul.FIRE '$.Madul.search_root.register', "#{mod}": path

        SEARCH_ROOTS[mod] = path.substring 0, path.lastIndexOf '/'

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
                @_parse_handle(val).ref

              proto[method].validate = decs
            else if typeof proto[method].validate == 'object'
              args_format = 'OBJECT'
              decs        = for own key, val of proto[method].validate
                { ref } = @_parse_handle val
                proto[method].validate[key] = ref
                ref
            else if typeof proto[method].validate == 'string'
              args_format = 'ARRAY'
              decs        = [ @_parse_handle(proto[method].validate).ref ]
            else if typeof proto[method].validate != 'undefined'
              @warn 'meta.invalid', validate: 'must be a String, Object, or Array'
              return
            else
              args_format = 'ARRAY'
              decs        = [ ]

            decs = decs.concat(proto[method].before.map (b, i) =>
              { ref } = @_parse_handle b
              proto[method].before[i] = ref
              ref
            ) if proto[method].before?

            decs = decs.concat(proto[method].after.map (a, i) =>
              { ref } = @_parse_handle a
              proto[method].after[i] = ref
              ref
            ) if proto[method].after?

            Madul.FIRE '$.Madul.decorators.hydrate', decs

            @_do_hydrate proto, decs, =>
              proto["_#{method}"] = proto[method]

              proto[method] = =>
                def = q.defer()
                me  = proto["_#{method}"]

                if args_format == 'ARRAY'
                  args = Array.prototype.slice.call arguments

                  if me.validate?
                    validators = for val, i in me.validate
                      { ref } = @_parse_handle val
                      Madul.FIRE '$.Madul.validator.execute', "#{ref}": args[i]
                      proto[ref].EXECUTE args[i]
                else if args_format == 'OBJECT'
                  args = arguments[0]

                  if me.validate?
                    validators = for own key, val of me.validate
                      { ref } = @_parse_handle val
                      Madul.FIRE '$.Madul.validator.execute', "#{ref}": args[key]
                      proto[ref].EXECUTE args[key]
                else
                  @warn 'cannot-continue', 'No arg format specified'

                  return def.reject 'No arg format specified'

                me.before = [ ] unless me.before?
                me.after  = [ ] unless me.after?

                q.all validators
                .then =>
                  q.all me.before.map (b) =>
                    Madul.FIRE '$.Madul.before_filter.execute', "#{b}": args
                    proto[b].before args
                .then =>
                  me.behavior.apply @, @_prep_invocation proto, method, args, def
                .then (result) =>
                  if me.after.length > 0
                    q.all me.after.map (b) =>
                      Madul.FIRE '$.Madul.after_filter.execute', "#{b}": result
                      b.after result
                  else
                    d = q.defer()

                    process.nextTick => d.resolve result

                    d.promise
                .then  (out) => def.resolve out
                .catch (err) => def.reject  err

                def.promise
          else
            @warn 'cannot-wrap', method

          WRAPPED[proto.constructor.name].push method

      _wrap_methods: =>
        proto = @.__proto__
        name  = proto.constructor.name

        while proto? && Object.keys(proto).length > 0 && WRAPPED[name]? == false
          for prop, body of proto
            if prop[0]                  != '_'         &&
               typeof proto["_#{prop}"] == 'undefined' &&
               WRAP(name, prop)         == true

              if typeof body == 'function' || typeof body.behavior == 'function'
                proto._do_wrap proto, prop

                INITIALIZERS name, prop if prop[0] == '$'

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

      _init_if_madul: (path, callback) =>
        mod      = require path
        proto    = mod
        is_madul = false

        while proto
          is_madul = true if proto.constructor.name == 'Madul'

          proto = proto.__super__

        if is_madul
          new mod()
            .initialize()
            .then callback
        else
          callback mod

      _load: (me, name, path, loaded) =>
        me._init_if_madul path, (mod) =>
          me._make_available name, mod
          loaded mod

      _check: (me, path, dep, ref, finished) =>
        fs.readdir path, (err, files) =>
          if err?
            me.warn 'file-not-found', err

            done type: 'ERROR', info: err
          else
            async.each files, (f, next) =>
              depth = "#{path}/#{f}"

              fs.stat depth, (e, s) =>
                if s.isDirectory() && f[0] != '.'
                  me._check me, depth, dep, ref, next
                else if s.isFile() && f.substring(0, f.length - 3) == dep
                  me._load me, ref, depth, (mod) => me._do_add me, mod, ref, next
                else
                  next()
            , finished

      _do_add: (me, mod, ref, next) =>
        Madul.FIRE "$.#{me.constructor.name}.dependency.register", ref

        me[underscore ref] = mod

        next()

      _add: (me, ref, path, next) =>
        me._init_if_madul path, (mod) =>
          me._make_available ref, mod
          me._do_add me, mod, ref, next

      _parse_handle: (value) =>
        tokens = value.split '='

        if tokens.length == 2
          initer = tokens[1].trim()
          t      = tokens[0].split '->'

          if t[0].indexOf('#') > -1
            r = t[0].split '#'

            root = SEARCH_ROOTS[r[0].trim()]
            t[0] = r[1]

          if t.length == 2
            name  = t[0].trim()
            alias = t[1].trim()
          else if t.length == 1
            name = alias = t[0].trim()
          else
            return next @warn 'alias.invalid', tokens[1]

          toks = initer.split ':'

          if toks.length == 2
            initer = toks[0].trim()
            pres   = toks[1].split(',').map (p) => p.trim()
          else if toks.length == 1
            initer = toks[0].trim()
          else
            return next @warn 'dependency-initializer.invalid', tokens[1]

        else if tokens.length == 1
          t = tokens[0].split '->'

          if t[0].indexOf('#') > -1
            r = t[0].split '#'

            root = SEARCH_ROOTS[r[0].trim()]
            t[0] = r[1]

          if t.length == 2
            name  = t[0].trim()
            alias = t[1].trim()
          else if t.length == 1
            name = alias = t[0].trim()
          else
            return next @warn 'alias.invalid', tokens[1]

        else
          return next @warn 'dependency.invalid', d

        { ref: alias || name, alias, name, root, initer, pres }

      _do_hydrate: (proto, deps, hydration_complete) =>
        initers = [ ]

        async.each deps, (d, next) =>
          { ref, alias, name, root, initer, pres } = @_parse_handle d

          if pres?
            insert_at = for p in pres
              index_for = (sibling) => sibling.alias == p.alias

              initers.find index_for

            insert_at.sort()

            insert_at = if insert_at.length == 0 then 0 else insert_at[insert_at.length - 1]

            initers.splice insert_at, 0, alias: alias, execute: initer

          if proto[underscore ref]? == false
            if available[strip ref]? == true
              proto._do_add proto, available[strip ref], ref, next
            else
              try
                proto._add proto, ref, name, next
              catch e
                if root?
                  Madul.FIRE '$.Madul.search_root.load', { name, alias, root }

                  proto._check proto, root, name, ref, next
                else
                  cwd = process.cwd()
                  pkg = "#{cwd}/node_modules/#{name}/package.json"

                  fs.stat pkg, (err, stat) =>
                    if stat?.isFile()
                      fs.readFile pkg, 'utf8', (err, data) =>
                        json = JSON.parse data
                        main = json.main || json._main || 'index.js'
                        path = "#{cwd}/node_modules/#{name}/#{main}"

                        proto._add proto, ref, path, next
                    else
                      proto._check proto, "#{cwd}/#{code_root}", name, ref, next
          else
            next()
        , =>
          async.eachSeries initers, (initer, next) =>
            @[initer.execute]().then next
          , hydration_complete

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
