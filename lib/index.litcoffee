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

    SKIP_WRAP = [
      'constructor'
      'initialize'
      'details'
      'fire'
      'warn'
      'listen'
      'set'
      'runtime_exception'
    ]

    HYRDATION_LISTENERS = { }

    INITIALIZERS = (cls, method) ->
      _INITIALIZERS[cls] = [ ] unless _INITIALIZERS[cls]?

      _INITIALIZERS[cls].push fn: method, called: false

    WRAP = (cls, method) ->
      WRAPPED[cls] = [ ] unless WRAPPED[cls]?

      WRAPPED[cls].indexOf(method) < 0

    determine_local = (token) ->
      project_local = false
      node_local    = false
      name          = token.substring 1, token.length

      if token[0] == '.'
        project_local = true
      else if token[0] == '~'
        node_local = true
      else
        name = token

      [project_local, node_local, name]

    parse_name_and_local = (tokens) ->
      [project_local, node_local, name] = determine_local tokens[0].trim()

      if tokens.length == 2
        alias = tokens[1].trim()
      else if tokens.length == 1
        alias = name
      else
        return Madul.FIRE '!.Madul.dependency_spec.alias.invalid', tokens[1]

      [project_local, node_local, name, alias]

    parse_alias_and_parent = (token) ->
      t = token.split '->'

      if t[0].indexOf('#') > -1
        r      = t[0].split '#'
        parent = r[0].trim()
        t[0]   = r[1]

      [parent, t]

    extract_properties = (token) ->
      [parent, t] = parse_alias_and_parent token
      [project_local, node_local, name, alias] = parse_name_and_local t

      [project_local, node_local, name, alias, parent]

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

        [project_local, node_local, name, alias, parent] = extract_properties tokens[0]

        if tokens.length == 2
          initializer = tokens[1].trim()
          toks        = initializer.split ':'
          initializer = toks[0].trim()

          if toks.length == 2
            prerequisites = toks[1].split(',').map (p) => p.trim()
          else if toks.length > 2
            return Madul.FIRE '!.Madul.dependency_spec.initializer.invalid', tokens[1]

        else if tokens.length > 2
          return Madul.FIRE '!.Madul.dependency_spec.invalid', d

        { ref: alias || name, alias, name, parent, initializer, prerequisites, project_local, node_local }

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

      warn: (event, details, finisher) =>
        Madul.FIRE "!.#{@constructor.name}.#{event}", details

        finisher() if typeof finisher == 'function'

      runtime_exception: (exit = false) =>
        (err) =>
          Madul.FIRE "!.#{@constructor.name}.runtime-exception",
            stack:     err.stack
            message:   err.message
            timestamp: microtime.now()

          process.exit(1) if exit == 'DIE_ON_EXCEPTION'

      set: (prop, val) =>
        proto = @.__proto__
        mod   = available[strip proto.constructor.name.toLowerCase()]

        if mod?
          mod.__proto__[prop] = val

      _report: (method, state, id, args, breaker) =>
        invoke = undefined
        params =
          uuid:      id
          args:      args
          timestamp: microtime.now()

        if state == 'reject'
          if typeof breaker == 'function'
            stop = new Error()
            stop.break = true

            breaker stop

          @warn "#{method}.#{state}", params
        else
          @fire "#{method}.#{state}", params

      _respond: (proto, method, id, deferred) =>
        (state, data, breaker) =>
          process.nextTick =>
            deferred[state] data

            proto._report method, state, id, data, breaker

      _prep_invocation: (proto, method, input, def) =>
        out = [ ]
        id  = uuid.v4fast()
        res = proto._respond proto, method, id, def
        e   = (brk) =>
          error = (err) => res 'reject', err, brk

          if typeof brk == 'function'
            error
          else
            error brk

        if Array.isArray input
          out = out.concat input
        else if typeof input == 'object'
          out.push input
        else
          msg = "input to #{proto.constructor.name}.#{method} must be an Array of Object"

          proto.warn.call proto, 'input.invalid', msg

          throw new Error msg

        out.push (out) => res 'resolve', out
        out.push e
        out.push (out) => res 'notify',  out

        proto._report method, 'invoke', id, out

        out

      _process_decorators: (proto, type) =>
        if Array.isArray proto[type]
          proto[type].map (b) => Madul.PARSE_SPEC(b).ref
        else if typeof proto[type] == 'string'
          [ Madul.PARSE_SPEC(proto[type]).ref ]
        else
          [ ]

      _do_wrap: (proto, method, wrapped) =>
        if SKIP_WRAP.includes method
          wrapped()
        else
          Madul.FIRE "$.#{proto.constructor.name}.#{method}.wrap"

          if typeof proto[method] == 'function'
            proto["_#{method}"] = proto[method]

            proto[method] = =>
              def   = q.defer()
              args  = Array.prototype.slice.call arguments
              input = proto._prep_invocation proto, method, args, def

              try
                proto["_#{method}"].apply proto, input
              catch e
                failed = if input[0].fail? then input[0].fail else input[input.length - 2]

                proto.warn.call proto, 'runtime-exception', stack: e.stack, message: e.message

                failed e.message

              def.promise

            INITIALIZERS proto.constructor.name, method if method[0] == '$'

            wrapped()
          else if typeof proto[method] == 'object'

            if Array.isArray proto[method].validate
              args_format = 'ARRAY'
              decs        = proto[method].validate

              proto[method].validators = for val, i in decs
                "#{i}": Madul.PARSE_SPEC(val).ref
            else if typeof proto[method].validate == 'object'
              args_format = 'OBJECT'
              decs        = [ ]

              for own key, val of proto[method].validate
                if Array.isArray val
                  for v in val
                    decs.push v
                else if typeof val == 'object'
                  for own k, v of val
                    if Array.isArray v
                      for V in v
                        decs.push V
                    else
                      decs.push v
                else
                  decs.push val

              proto[method].validators = [ ]

              for own key, val of proto[method].validate
                if Array.isArray val
                  proto[method].validators.push "#{key}": for v in val
                    Madul.PARSE_SPEC(v).ref
                else if typeof val == 'object'
                  for own k, v of val
                    if Array.isArray v
                      proto[method].validators.push "#{key}.#{k}": for V in v
                        Madul.PARSE_SPEC(V).ref
                    else
                      proto[method].validators.push "#{key}.#{k}": Madul.PARSE_SPEC(v).ref
                else
                  proto[method].validators.push "#{key}": Madul.PARSE_SPEC(val).ref
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

            deduped = decs.filter (e, i, a) => a.indexOf(e) == i

            proto.fire.call proto, 'decorators.hydrate', deduped

            handle_err = (fn, args, next, reject) =>
              (err) =>
                proto.warn.call proto, "#{fn}.validator.failed", args
                reject err.message

                stop = new Error()
                stop.break = true

                next stop

            @_do_hydrate proto, deduped, =>
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

                before = @_process_decorators me, 'before'
                after  = @_process_decorators me, 'after'

                q.Promise (resolve, reject) =>
                  async.eachSeries me.validators, (v, next) =>
                    arg       = Object.keys(v)[0]
                    validator = v[arg]
                    input     = arg
                    prop      = args

                    for a in arg.split '.'
                      prop  = prop[a]
                      input = a

                    if Array.isArray validator
                      async.eachSeries validator, (v, nxt) =>
                        proto.fire.call proto, 'validator.execute', "#{v}": prop

                        proto[v].EXECUTE.call proto[v], input, prop
                          .then nxt
                          .catch handle_err v, { "#{input}": prop }, nxt, reject
                      , next
                    else
                      proto.fire.call proto, 'validator.execute', "#{validator}": prop

                      proto[validator].EXECUTE.call proto[validator], input, prop
                        .then next
                        .catch handle_err v, { "#{input}": prop }, next, reject
                  , resolve
                .then =>
                  q.Promise (resolve, reject) =>
                    async.eachSeries before, (b, next) =>
                      proto.fire.call proto, 'before_filter.execute', "#{b}": args

                      proto[b].before.call proto[b], args
                        .then next
                        .catch handle_err b, args, next, reject
                    , resolve
                .then =>
                  input = proto._prep_invocation proto, method, args, def

                  try
                    me.behavior.apply me, input
                  catch e
                    failed = if input[0].fail? then input[0].fail else input[input.length - 2]

                    me.warn.call me, 'runtime-exception', stack: e.stack, message: e.message

                    failed e.message
                .then (result) =>
                  q.Promise (resolve, reject) =>
                    if after.length > 0
                      async.eachSeries after, (a, next) =>
                        proto.fire.call proto, 'after_filter.execute', "#{a}": args

                        proto[a].after.call proto[a], result
                          .then next
                          .catch handle_err b, args, next, reject
                      , => resolve result
                    else
                      process.nextTick => resolve result
                .then  (out) => def.resolve out
                .catch (err) => def.reject  err

                def.promise

              INITIALIZERS proto.constructor.name, method if method[0] == '$'

              wrapped()
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
            wrap.proto._do_wrap wrap.proto, method, next
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
        error = true

        fs.readdir path, (err, files) =>
          if err?
            me.warn 'file-not-found', err

            finished 'NOT_FOUND'
          else
            async.each files, (f, next) =>
              depth = "#{path}/#{f}"

              fs.stat depth, (e, s) =>
                if s.isDirectory() && f[0] != '.'
                  me._check me, depth, dep, ref, next
                else if s.isFile() && f.substring(0, f.length - 3) == dep
                  me._load me, ref, depth, (mod) =>
                    error = undefined
                    me._do_add me, ref, next
                else
                  next()
            , => finished error

      _do_add: (me, ref, next) =>
        Madul.FIRE "$.#{me.constructor.name}.dependency.register", ref

        me[underscore ref] = available[strip ref]

        next()

      _add: (me, ref, path, next) =>
        me._init_if_madul path, (mod) =>
          me._make_available ref, mod
          me._do_add me, ref, next

      _do_hydrate: (proto, deps, hydration_complete) =>
        initers = [ ]

        async.each deps, (d, next) =>
          spec = Madul.PARSE_SPEC d

          if spec.prerequisites?
            insert_at = for p in spec.prerequisites
              index_for = (sibling) => sibling.alias == p.alias

              initers.find index_for

            insert_at.sort()

            insert_at = if insert_at.length == 0 then 0 else insert_at[insert_at.length - 1]

            initers.splice insert_at, 0, alias: spec.alias, execute: spec.initializer
          else if spec.initializer?
            initers.push alias: spec.alias, execute: spec.initializer

          if typeof proto[underscore spec.ref] == 'undefined'
            if available[strip spec.ref]? == true
              proto._do_add proto, spec.ref, next
            else
              if spec.parent?
                proto.fire.call proto, 'search_root.load', { name: spec.name, alias: spec.alias, parent: spec.parent }

                @_do_hydrate proto, [ spec.parent ], =>
                  if SEARCH_ROOTS[spec.parent] == undefined
                    SEARCH_ROOTS[spec.parent] = @_find_code_root spec.parent

                  proto._check proto, SEARCH_ROOTS[spec.parent], spec.name, spec.ref, next
              else if spec.node_local
                key = @_find_require_key proto.constructor.name

                async.eachSeries require.cache[key].paths, (path, nxt) =>
                  @_load_from_package_json proto, path, spec.name, spec.ref, nxt, =>
                    stop = new Error()
                    stop.break = true

                    next()
                    nxt stop
              else if spec.project_local
                proto._check proto, LOCALS[proto.constructor.name], spec.name, spec.ref, next
              else
                try
                  proto._add proto, spec.ref, spec.name, next
                catch e
                  path = "#{process.cwd()}/node_modules"

                  @_load_from_package_json proto, path, spec.name, spec.ref, next, =>
                    pth = LOCALS[proto.constructor.name]

                    try
                      proto._check proto, pth, spec.name, spec.ref, (err) =>
                        if err?
                          proto._check proto, "#{process.cwd()}/dist", spec.name, spec.ref, next
                        else
                          next()

          else
            next()
        , =>
          async.eachSeries initers, (initer, next) =>
            proto[initer.execute].apply(@).then next
          , hydration_complete

      _load_from_package_json: (proto, path, name, ref, success, fail) =>
        pkg = "#{path}/#{name}/package.json"

        fs.stat pkg, (err, stat) =>
          if stat?.isFile()
            fs.readFile pkg, 'utf8', (err, data) =>
              json = JSON.parse data
              main = json.main || json._main || 'index.js'
              path = "#{path}/#{name}/#{main}"

              proto._add proto, ref, path, success
          else
            fail()

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

      _do_find: (thing, cb) =>
        file  = thing.toLowerCase()
        found = for own key, val of require.cache
          if key.replace(/_/g, '').toLowerCase().includes file
            cb key

        found
          .filter (f) => f?
          .sort((a, b) => a.length - b.length)[0]

      _find_require_key: (resource) =>
        @_do_find resource, (key) => key

      _find_code_root: (resource) =>
        @_do_find resource, (key) => key.substring(0, key.lastIndexOf '/').split '/'
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
