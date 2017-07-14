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

    underscore = (value) -> value.replace /\W+/g, '_'
    strip      = (name)  -> name.toLowerCase().replace /\W+/g, ''

    SEARCH_ROOTS  = { }
    WRAPPED       = { }
    _INITIALIZERS = { }
    HYDRATED      = { }
    LOCALS        = { }

    HYRDATION_LISTENERS = { }

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

      @PARSE_SPEC: (value) =>
        tokens = value.split '='

        if tokens.length == 2
          initer = tokens[1].trim()
          t      = tokens[0].split '->'

          if t[0].indexOf('#') > -1
            r = t[0].split '#'

            root = r[0].trim()
            t[0] = r[1]

          if t.length == 2
            n = t[0].trim()

            if n[0] == '.'
              local = true
              name  = n.substring 1, n.length
            else
              local = false
              name  = n

            alias = t[1].trim()
          else if t.length == 1
            n = t[0].trim()

            if n[0] == '.'
              local = true
              name  = alias = n.substring 1, n.length
            else
              local = false
              name  = alias = n
          else
            return Madul.FIRE '!.Madul.dependency_spec.alias.invalid', tokens[1]

          toks = initer.split ':'

          if toks.length == 2
            initer = toks[0].trim()
            pres   = toks[1].split(',').map (p) => p.trim()
          else if toks.length == 1
            initer = toks[0].trim()
          else
            return Madul.FIRE '!.Madul.dependency_spec.initializer.invalid', tokens[1]

        else if tokens.length == 1
          t = tokens[0].split '->'

          if t[0].indexOf('#') > -1
            r = t[0].split '#'

            root = r[0].trim()
            t[0] = r[1]

          if t.length == 2
            n = t[0].trim()

            if n[0] == '.'
              local = true
              name  = n.substring 1, n.length
            else
              local = false
              name  = n

            alias = t[1].trim()
          else if t.length == 1
            n = t[0].trim()

            if n[0] == '.'
              local = true
              name  = alias = n.substring 1, n.length
            else
              local = false
              name  = alias = n
          else
            return Madul.FIRE '!.Madul.dependency_spec.alias.invalid', tokens[1]

        else
          return Madul.FIRE '!.Madul.dependency_spec.invalid', d

        { ref: alias || name, alias, name, root, initer, pres, local }

      @BUILD_SPEC: ({ search_root, name, alias, initializer, prerequisites }) =>
        unless name?
          return Madul.FIRE '!.Madul.dependency_spec.name-required', arguments[0]

        if prerequisites? && initializer? == false
          return Madul.FIRE '!.Madul.dependency_spec.prerequisites-require-initializer', arguments[0]

        "#{if search_root?   then "#{search_root}#"            else ''}\
         #{name}\
         #{if alias?         then " -> #{alias}"               else ''}\
         #{if initializer?   then " = #{initializer}"          else ''}\
         #{if prerequisites? then ":#{prerequisites.join ','}" else ''}\
        "

      listen: (event, callback) ->
        Madul.LISTEN "*.#{@constructor.name}.#{event}", callback

      fire: (event, args) ->
        Madul.FIRE "@.#{@constructor.name}.#{event}", args

      warn: (event, details) ->
        Madul.FIRE "!.#{@constructor.name}.#{event}", details

      _report: (name, method, state, id, args) =>
        if state == 'reject'
          Madul.FIRE "!.#{name}.#{method}.#{state}",
            uuid:      id
            message:   args
            timestamp: microtime.now()
        else
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
          proto.warn.call proto, 'input.invalid', msg
          throw new Error msg

        proto._report proto.constructor.name, method, 'invoke', id, input

        input

      _process_decorators: (proto, type) =>
        if Array.isArray proto[type]
          proto[type].map (b) => Madul.PARSE_SPEC(b).ref
        else if typeof proto[type] == 'string'
          [ Madul.PARSE_SPEC(proto[type]).ref ]
        else
          [ ]

      _do_wrap: (proto, method) =>
        if method != 'fire' && method != 'warn' && method != 'listen'
          Madul.FIRE "$.#{proto.constructor.name}.#{method}.wrap"

          if typeof proto[method] == 'function'
            proto["_#{method}"] = proto[method]

            proto[method] = =>
              def  = q.defer()
              args = Array.prototype.slice.call arguments

              proto["_#{method}"].apply proto, proto._prep_invocation proto, method, args, def

              def.promise
          else if typeof proto[method] == 'object'

            if Array.isArray proto[method].validate
              args_format = 'ARRAY'
              decs        = proto[method].validate

              proto[method].validators = for val, i in decs
                "#{i}": Madul.PARSE_SPEC(val).ref
            else if typeof proto[method].validate == 'object'
              args_format = 'OBJECT'
              decs        = for own key, val of proto[method].validate
                val

              proto[method].validators = for own key, val of proto[method].validate
                "#{key}": Madul.PARSE_SPEC(val).ref
            else if typeof proto[method].validate == 'string'
              args_format = 'ARRAY'
              decs        = [ proto[method].validate ]

              proto[method].validators = [ { 0: Madul.PARSE_SPEC(proto[method].validate).ref }]
            else if typeof proto[method].validate != 'undefined'
              proto.warn.call proto, 'meta.invalid', validate: 'must be a String, Object, or Array'
              return
            else
              args_format = 'ARRAY'
              decs        = [ ]

            if Array.isArray proto[method].before
              decs = decs.concat proto[method].before
            else if typeof proto[method].before == 'string'
              decs = decs.concat [ proto[method].before ]

            if Array.isArray proto[method].after
              decs = decs.concat proto[method].after
            else if typeof proto[method].after == 'string'
              decs = decs.concat [ Madul.PARSE_SPEC proto[method].after ]

            Madul.FIRE '$.Madul.decorators.hydrate', decs

            @_do_hydrate proto, decs, =>
              proto["_#{method}"] = proto[method]

              proto[method] = =>
                def = q.defer()
                me  = proto["_#{method}"]

                if args_format == 'ARRAY'
                  args = Array.prototype.slice.call arguments
                else if args_format == 'OBJECT'
                  args = arguments[0]
                else
                  proto.warn.call proto, 'cannot-continue', 'No arg format specified'

                  return def.reject 'No arg format specified'

                validators = for v in me.validators
                  arg       = Object.keys(v)[0]
                  validator = v[arg]

                  Madul.FIRE '$.Madul.validator.execute', "#{validator}": args[arg]

                  proto[validator].EXECUTE.call proto[validator], args[arg]

                before = @_process_decorators 'before'
                after  = @_process_decorators 'after'

                q.all validators
                .then =>
                  q.all before.map (b) =>
                    Madul.FIRE '$.Madul.before_filter.execute', "#{b}": args
                    proto[b].before.call proto[b], args
                .then =>
                  me.behavior.apply me, @_prep_invocation proto, method, args, def
                .then (result) =>
                  if after.length > 0
                    q.all after.map (a) =>
                      Madul.FIRE '$.Madul.after_filter.execute', "#{a}": result
                      proto[a].after.call proto[a], result
                  else
                    d = q.defer()

                    process.nextTick => d.resolve result

                    d.promise
                .then  (out) => def.resolve out
                .catch (err) => def.reject  err

                def.promise
          else
            proto.warn.call proto, 'cannot-wrap', method

          WRAPPED[proto.constructor.name].push method

      _wrap_methods: (proto, callback) =>
        name    = proto.constructor.name
        to_wrap = [ ]

        while proto? && Object.keys(proto).length > 0 && WRAPPED[name]? == false
          to_wrap.push { proto, name, methods: [ ] }

          for own prop, body of proto
            if prop[0]                  != '_'         &&
               typeof proto["_#{prop}"] == 'undefined' &&
               WRAP(name, prop)         == true

              continue if proto.deps? && proto.deps.indexOf(prop.replace(/_/g, '-')) > -1

              if typeof body == 'function' || typeof body?.behavior == 'function'
                to_wrap[to_wrap.length - 1].methods.push prop

          proto = proto.__proto__
          name  = proto.constructor.name

        async.each to_wrap.reverse(), (wrap, completed) =>
          async.each wrap.methods, (method, next) =>
            wrap.proto._do_wrap wrap.proto, method

            INITIALIZERS wrap.name, method if method[0] == '$'

            next()
          , => @_call_initializers_for wrap.proto, wrap.name, completed
        , callback

      _make_available: (name, mod) =>
        Madul.FIRE "$.#{name}.available"

        available[strip name] = mod

      _hydrate_deps: (proto, done) =>
        protos = [ proto ]

        if proto.__proto__?
          while proto.__proto__? && Object.keys(proto.__proto__).length > 0
            protos.push proto = proto.__proto__

        async.each protos.reverse(), (p, next) =>
          name = p.constructor.name

          if p.hasOwnProperty 'deps'
            if HYDRATED[name] == undefined
              HYDRATED[name]            = false
              HYRDATION_LISTENERS[name] = [ next ]

              p._do_hydrate p, p.deps, =>
                HYDRATED[name] = true

                for listener in HYRDATION_LISTENERS[name]
                  listener()
            else if HYDRATED[name] == false
              HYRDATION_LISTENERS[name].push next
            else if HYDRATED[name] == true
              next()
          else
            next()
        , done

      _init_if_madul: (path, callback) =>
        mod      = require path
        proto    = mod
        is_madul = false

        while proto
          is_madul = true if proto.name == 'Madul'
          if is_madul                            == false      &&
             proto.constructor.name              != 'Object'   &&
             typeof proto                        == 'function' &&
             typeof proto.__super__?.constructor == 'function'
            proto = proto.__super__.constructor
          else
            proto = undefined

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

      _do_hydrate: (proto, deps, hydration_complete) =>
        initers = [ ]

        async.each deps, (d, next) =>
          { ref, alias, name, root, initer, pres, local } = Madul.PARSE_SPEC d

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
              if root?
                Madul.FIRE '$.Madul.search_root.load', { name, alias, root }

                @_do_hydrate proto, [ root ], =>
                  if SEARCH_ROOTS[root] == undefined
                    SEARCH_ROOTS[root] = @_find_code_root root

                  proto._check proto, SEARCH_ROOTS[root], name, ref, next
              else if local
                proto._check proto, LOCALS[proto.constructor.name], name, ref, next
              else
                try
                  proto._add proto, ref, name, next
                catch e
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
                      proto._check proto, LOCALS[proto.constructor.name], name, ref, next
          else
            next()
        , =>
          async.eachSeries initers, (initer, next) =>
            proto[initer.execute].apply(@).then next
          , hydration_complete

      _finish_up: (proto, args) =>
        name = proto.constructor.name

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

      _call_initializers_for: (proto, name, callback) =>
        if _INITIALIZERS[name]?
          async.each _INITIALIZERS[name], (initializer, next) =>
            if initializer.called == false
              proto[initializer.fn].apply proto
                .then =>
                  initializer.called = true
                  next()
            else
              next()
          , callback
        else
          callback()

      _find_code_root: (resource) =>
        file  = resource.toLowerCase()
        found = for own key, val of require.cache
          if key.replace(/_/g, '').toLowerCase().includes file
            key.substring(0, key.lastIndexOf '/').split '/'

        found
          .filter (f) => f?
          .sort((a, b) => a.length - b.length)[0]
          .join '/'

      initialize: =>
        deferred = q.defer()
        proto    = @.__proto__
        name     = proto.constructor.name

        Madul.FIRE "$.#{name}.request_instance"

        if initialized[name] == undefined
          Madul.FIRE "$.#{name}.initialize"

          initialized[name] = false
          listeners[name]   = [ deferred.resolve ]

          if LOCALS[name] == undefined
            LOCALS[name] = @_find_code_root name

          @_hydrate_deps proto, => @_wrap_methods proto, => @_finish_up proto
        else if initialized[name] == false
          listeners[name].push deferred.resolve
        else if initialized[name] == true
          process.nextTick => deferred.resolve available[strip name]

        deferred.promise

    module.exports = Madul
