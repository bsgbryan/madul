    Array.prototype.last = -> this[this.length - 1]

    q     = require 'q'
    fs    = require 'fs'
    async = require 'async'

    microtime = require 'microtime'

    logger = require './logger'

    classes     = { }
    available   = { }
    initialized = { }

    class Madul

      constructor: (madul_name, class_name) ->
        @debug = (msg, data) -> logger.debug msg, data
        @info  = (msg, data) -> logger.info  msg, data
        @warn  = (msg, data) -> logger.warn  msg, data
        @error = (msg, data) -> logger.error msg, data

        @clazz       = class_name || arguments.callee.caller.name
        @madul_name  = madul_name

        classes[@clazz] = madul_name

        initialized[@clazz] = false unless initialized[@clazz] == true

        logger.trace "Instantiating #{@clazz}"

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

      hydrate: (deps, done) =>
        load = (name, path, loaded) =>
          mod = require path

          if typeof mod == 'function'
            new mod name
              .initialize @ctor_params?[name]
              .then (mod) =>
                available[name] = mod
                loaded true
          else
            available[name] = mod
            loaded true

        check_directory = (path, dep, loaded) =>
          fs.readdir path, (err, files) =>
            if err?
              done type: 'ERROR', info: err
            else
              async.each files, (f, next) =>
                depth = "#{path}/#{f}"

                fs.stat depth, (e, s) =>
                  if s.isDirectory() && f[0] != '.'
                    check_directory depth, dep, => next()
                  else if s.isFile() && f.substring(0, f.length - 3) == dep
                    load f.substring(0, f.length - 3), depth, => loaded true
                  else
                    next()
              , => loaded true

        add_dependency = (name, mod) =>
          n = name.replace /\W+/g, '_'
          @[n] = mod

        async.eachSeries deps, (d, next) =>
          if @[d]? == false
            if available[d]? == true
              add_dependency d, available[d]
              next()
            else
              try
                available[d] = require d
                add_dependency d, available[d]
                next()
              catch e
                pkg = "#{process.cwd()}/node_modules/#{d}/package.json"

                fs.stat pkg, (err, stat) =>
                  if stat?.isFile()
                    fs.readFile pkg, 'utf8', (err, data) =>
                      json = JSON.parse data
                      main = json.main || json._main

                      available[d] = require "#{process.cwd()}/node_modules/#{d}/#{main}"

                      add_dependency d, available[d]
                      next()
                  else
                    check_directory "#{process.cwd()}/dist", d, (loaded) =>
                      if loaded
                        add_dependency d, available[d]
                        next()
          else
            next()
        , done

      finish_up: (resolve, args) =>
        if typeof @post_initialize == 'function'
          @do_wrap 'post_initialize'
          @post_initialize(args)
            .then =>
              available[classes[@clazz]] = @
              resolve @
        else
          available[classes[@clazz]] = @
          resolve @

      initialize: (args = { }, wrap = true) =>
        deferred = q.defer()

        if initialized[@clazz] == false
          initialized[@clazz] = true

          @wrap_methods() if wrap

          if @deps?
            @hydrate @deps, => @finish_up deferred.resolve, args
          else
            @finish_up deferred.resolve, args
        else
          process.nextTick => deferred.resolve available[classes[@clazz]]

        deferred.promise

    module.exports = Madul
