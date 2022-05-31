import { ParsedConfig } from 'boot/dev/config-parse'
import { fork } from 'child_process'
import { dirname, join } from 'path'
import { waitUntil } from 'server-utility'

const dbProxyQueue = {} as Record<string, (result: any) => void>
const forks = {} as Record<string, ReturnType<typeof fork>>
const cwd = join(dirname(__filename), '..')

export default {
  start: async (config: ParsedConfig) => {
    const dbs = {} as Record<string, any>
    const init = [] as Promise<void>[]
    for (let name of Object.keys(config.dbs)) {
      init.push(
        new Promise(async (finish) => {
          forks[name] = fork(join(cwd, 'pkgs', 'dbs', name, 'db.js'))
          const fk = forks[name] as any
          forks[name].once('spawn', () => {
            forks[name].on(
              'message',
              (data: { id: string; value: any; event?: 'ready' }) => {
                if (data.event === 'ready') {
                  finish()
                }
                if (data.id) {
                  const result = dbProxyQueue[data.id]
                  if (result) {
                    result(data.value)
                    delete dbProxyQueue[data.id]
                  }
                }
              }
            )
            fk.ready = true
          })
          forks[name].once('disconnect', () => {
            fk.ready = false
          })
          dbs[name] = dbProxy(forks[name] as any, name)
        })
      )
    }

    await Promise.all(init)

    return dbs as any
  },
  stop: async () => {
    for (let f of Object.values(forks)) {
      f.kill()
    }
  },
}

const dbProxy = (
  fk: ReturnType<typeof fork> & { ready: boolean },
  name: string
) => {
  return new Proxy(
    {},
    {
      get(_, table) {
        return new Proxy(
          {},
          {
            get(_, action) {
              return (...params: any[]) => {
                return new Promise<any>(async (resolve) => {
                  const id =
                    new Date().getTime() +
                    '|' +
                    Math.round(Math.random() * 9999999)

                  dbProxyQueue[id] = resolve

                  if (!fk.ready) {
                    await waitUntil(() => fk.ready)
                  }
                  fk.send({ id, table, action, params })
                })
              }
            },
          }
        )
      },
    }
  )
}
