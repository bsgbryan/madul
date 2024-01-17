import {
  Config,
  Madul,
  MadulDictionary,
  ParameterSet,
} from "@/types"

import {
  manage as add,
  items,
  uninit,
} from "@/CollectionManager"

import DependencyHydrator from "@/DependencyHydrator"

const available: MadulDictionary = { }

const Bootstrap = async (
  spec:                               string,
  params = {                     } as ParameterSet,
  config = { root: process.cwd() } as Config,
): Promise<Madul> =>
  new Promise(async (resolve, reject) => {
    const listeners = `${spec}::LISTENERS`,
          cb        = () => resolve(available[spec] as Madul),
          item      = { key: null, value: cb }

    switch (available[spec]) {
      case undefined:
        available[spec] = null

        add(listeners, item)

        try {
          const paths = (await Bun.file(`${config.root}/tsconfig.json`).json())?.
            compilerOptions?.
            paths

          if (paths) {
            const prefix = Object.keys(paths).find(
              p => p.substring(0, p.length - 2) === spec.split('/')[0]
            )

            if (prefix) {
              const path = paths[prefix][0].
                replace('*', spec.substring(2)).
                replace('.', process.cwd())

              const mod    = await import(path),
                    output = { name: spec } as Madul

              if (typeof mod.dependancies === 'function') {
                const deps     = mod.dependancies(),
                      hydrated = await DependencyHydrator(
                        Object.keys(deps),
                        Bootstrap,
                        params,
                        config.root,
                      )

                for (const dep of Object.keys(deps))
                  for (const d of deps[dep])
                    // @ts-ignore
                    output[d] = hydrated[dep][d]
              }

              for (const prop of Object.keys(mod))
                output[prop] = mod[prop]

              available[spec] = output
              
              const callbacks = items<CallableFunction>(listeners)

              if (Array.isArray(callbacks))
                for (const done of callbacks) await done()

              uninit(listeners)
            }
          }
          else reject(new Error("No compilerOptions.paths defined in tsconfig.json"))
        }
        catch (e) { return reject(`Error loading ${spec}: ${e}`) }

        break
      case null:
        add(listeners, item)

        break
      default: cb()
    }
  })

export default Bootstrap
