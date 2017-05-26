    Array.prototype.last = -> this[this.length - 1]

    q     = require 'q'
    fs    = require 'fs'
    async = require 'async'

    microtime = require 'microtime'

    logger = require './logger'

    available   = { }
    initialized = { }

    class Madul

      do_wrap: (method) =>
        callMe = @[method]

        @["_#{method}"] = @[method]

        @[method] = =>
          deferred = q.defer()
          start    = microtime.now()
          update   = start

          respond = (state, data) =>
            deferred[state] data

            if state == 'reject'
              logger.rejected @clazz, method, microtime.now() - start, data

            if process.env.MADUL_LOG_LEVEL > 4
              if state == 'resolve'
                logger.resolved @clazz, method, microtime.now() - start, data
              else if state == 'notify'
                logger.notify @clazz, method, microtime.now() - update, data
                update = microtime.now()

          @done   = (out) => respond 'resolve', out
          @fail   = (err) => respond 'reject',  err
          @update = (out) => respond 'notify',  out

          args = Array.prototype.slice.call arguments

          logger.trace "Invoking #{@clazz}.#{method}()", args

          @["_#{method}"].apply null, args

          deferred.promise

      wrap_methods: => @pub?.forEach (method) => @do_wrap method

      strip: (name) => name.toLowerCase().replace /\W+/g, ''

      make_available: (name, mod) => available[@strip name] = mod

      hydrate: (deps, done) =>
        load = (name, path, loaded) =>
          mod = require path

          if typeof mod == 'function'
            new mod name
              .initialize @ctor_params?[name]
              .then (mod) =>
                @make_available name, mod
                loaded true
          else
            @make_available name, mod
            loaded true

        check = (path, dep, loaded) =>
          fs.readdir path, (err, files) =>
            if err?
              done type: 'ERROR', info: err
            else
              async.each files, (f, next) =>
                depth = "#{path}/#{f}"

                fs.stat depth, (e, s) =>
                  if s.isDirectory() && f[0] != '.'
                    check depth, dep, => next()
                  else if s.isFile() && f.substring(0, f.length - 3) == dep
                    load f.substring(0, f.length - 3), depth, => loaded true
                  else
                    next()
              , => loaded true

        add_dependency = (name, mod) =>
          n = name.replace /\W+/g, '_'
          @[n] = mod

        do_add = (name, next) =>
          add_dependency name, available[@strip name]
          next()

        add = (name, resource, next) =>
          @make_available name, require resource
          do_add name, next

        async.eachSeries deps, (d, next) =>
          if @[d]? == false
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
                      main = json.main || json._main

                      add d, "#{cwd}/node_modules/#{d}/#{main}", next
                  else
                    check "#{cwd}/dist", d, (loaded) => do_add d, next if loaded
          else
            next()
        , done

      finish_up: (resolve, args) =>
        if typeof @post_initialize == 'function'
          @do_wrap 'post_initialize'
          @post_initialize args
            .then =>
              @make_available @clazz, @
              resolve @
        else
          @make_available @clazz, @
          resolve @

      initialize: (args = { }) =>
        deferred = q.defer()

        @clazz = @constructor.name unless @clazz?

        if initialized[@clazz] != true
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
