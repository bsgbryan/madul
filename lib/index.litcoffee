    Array.prototype.last = -> this[this.length - 1]

    q     = require 'q'
    fs    = require 'fs'
    async = require 'async'
    uuid  = require 'uuid-1345'

    microtime = require 'microtime'

    EventEmitter2 = require('eventemitter2').EventEmitter2
    emitter = new EventEmitter2 wildcard: true

    available   = { }
    initialized = { }

    code_root = process.env.MADUL_ROOT || 'dist'

    underscore = (value) -> value.replace /\W+/g, '_'

    WRAPPED = { }

    _INITIALIZERS = { }

    INITIALIZERS = (cls, method) ->
      _INITIALIZERS[cls] = [ ] unless _INITIALIZERS[cls]?

      _INITIALIZERS[cls].push method

    WRAP = (cls, method) ->
      unless WRAPPED[cls]?
        WRAPPED[cls] = [
          'constructor'
          'listen'
          'fire'
          'warn'
          'report'
          'do_wrap'
          'wrap_methods'
          'strip'
          'make_available'
          'hydrate'
          'finish_up'
          'initialize'
        ]

      WRAPPED[cls].indexOf(method) < 0

    class Madul

      @LISTEN: (event, callback) => emitter.on event, callback

      @FIRE: (event, args) => emitter.emit event, args

      listen: (event, callback) => Madul.LISTEN "*.#{@clazz}.#{event}", callback

      fire: (event, args) => Madul.FIRE "@.#{@clazz}.#{event}", args

      warn: (event, details) => Madul.FIRE "!.#{@clazz}.#{event}", details

      report: (method, state, id, args) =>
        @fire "#{method}.#{state}",
          uuid:      id
          args:      args
          timestamp: microtime.now()

      do_wrap: (method) =>
        callMe = @[method]

        Madul.FIRE "$.#{@clazz}.#{method}.wrap"

        @["_#{method}"] = @[method]

        respond = (id, deferred) =>
          (state, data) =>
            process.nextTick =>
              deferred[state] data

              @report method, state, id, data

        WRAPPED[@clazz].push method

        @[method] = =>
          id   = uuid.v4fast()
          def  = q.defer()
          args = if arguments[0]? then Array.prototype.slice.call arguments else [ ]
          res  = respond id, def

          args.push (out) => res 'resolve', out
          args.push (err) => res 'reject',  err
          args.push (out) => res 'notify',  out

          @report method, 'invoke', id, args

          @["_#{method}"].apply @, args

          def.promise

      wrap_methods: =>
        props = Object.keys @constructor.prototype

        for prop in props
          if prop[0] != '_'                      &&
             typeof @[prop] == 'function'        &&
             typeof @["_#{prop}"] == 'undefined' &&
             WRAP(@clazz, prop) == true

            @do_wrap prop

            INITIALIZERS @clazz, prop if prop[0] == '$'

      strip: (name) => name.toLowerCase().replace /\W+/g, ''

      make_available: (name, mod) =>
        Madul.FIRE "$.#{name}.available"

        available[@strip name] = mod

      hydrate: (deps, done) =>
        load = (name, path, loaded) =>
          mod = require path

          if typeof mod == 'function'
            new mod name
              .initialize @ctor_params?[name]
              .then (mod) =>
                @make_available name, mod
                loaded()
          else
            @make_available name, mod
            loaded()

        check = (path, dep, finished) =>
          fs.readdir path, (err, files) =>
            if err?
              Madul.FIRE '$.error', err

              done type: 'ERROR', info: err
            else
              async.each files, (f, next) =>
                depth = "#{path}/#{f}"

                fs.stat depth, (e, s) =>
                  if s.isDirectory() && f[0] != '.'
                    check depth, dep, next
                  else if s.isFile() && f.substring(0, f.length - 3) == dep
                    load f.substring(0, f.length - 3), depth, => do_add dep, next
                  else
                    next()
              , finished

        add_dependency = (name, mod) =>
          Madul.FIRE "$.#{@clazz}.dependency.register", name
          @[underscore name] = mod

        do_add = (name, next) =>
          add_dependency name, available[@strip name]
          next()

        add = (name, resource, next) =>
          @make_available name, require resource
          do_add name, next

        async.each deps, (d, next) =>
          if @[underscore d]? == false
            if available[@strip d]? == true
              do_add d, next
            else
              try
                add d, d, next
              catch e
                cwd = process.cwd()
                pkg = "#{cwd}/node_modules/#{d}/package.json"

                fs.stat pkg, (err, stat) =>
                  if stat?.isFile()
                    fs.readFile pkg, 'utf8', (err, data) =>
                      json = JSON.parse data
                      main = json.main || json._main || 'index.js'

                      add d, "#{cwd}/node_modules/#{d}/#{main}", next
                  else
                    check "#{cwd}/#{code_root}", d, next
          else
            next()
        , done

      finish_up: (resolve, args) =>
        async.each _INITIALIZERS[@clazz], (initializer, next) =>
          @[initializer] args
            .then next
        , =>
          @make_available @clazz, @
          resolve @
          Madul.FIRE "$.#{@clazz}.initialized"

      initialize: =>
        deferred = q.defer()
        args     = if arguments[0]? then Array.prototype.slice.call arguments else undefined

        @clazz = @constructor.name unless @clazz?

        Madul.FIRE "$.#{@clazz}.request_instance", args

        if initialized[@clazz] != true
          Madul.FIRE "$.#{@clazz}.initialize", args

          initialized[@clazz] = true

          @wrap_methods()

          if @deps?
            @hydrate @deps, => @finish_up deferred.resolve, args
          else
            @finish_up deferred.resolve, args
        else
          process.nextTick => deferred.resolve available[@strip @clazz]

        deferred.promise

    module.exports = Madul
