import type { ParsedConfig } from 'boot/dev/config-parse'
import { fork } from 'child_process'
import { dirname, join } from 'path'
import { waitUntil } from 'server-utility'
import type dbs_type from 'dbs'

const dbProxyQueue = {} as Record<string, (result: any) => void>
const forks = {} as Record<string, ReturnType<typeof fork>>
const cwd = join(dirname(__filename), '..')
export const dbs = {} as typeof dbs_type

export default {
  start: async (config: ParsedConfig) => {
    const init = [] as Promise<void>[]
    for (let name of Object.keys(config.dbs)) {
      init.push(
        new Promise(async (finish) => {
          const setupFork = () => {
            forks[name] = fork(join(cwd, 'pkgs', 'dbs', name, 'db.js'))
            const fk = forks[name] as any
            forks[name].once('spawn', () => {
              fk.ready = true
            })
            forks[name].on(
              'message',
              (data: { id: string; value: any; event?: 'ready' }) => {
                if (data.event === 'ready') {
                  finish()
                }
                if (data.id) {
                  const result = dbProxyQueue[data.id] as any

                  if (result) {
                    result(data.value)
                    delete dbProxyQueue[data.id]
                  }
                }
              }
            )
            forks[name].stdout?.pipe(process.stdout)
            forks[name].stderr?.pipe(process.stderr)
            forks[name].once('disconnect', () => {
              fk.ready = false
              setupFork()
            })
            ;(dbs as any)[name] = dbProxy(forks[name] as any, name)
          }
          setupFork()
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
                  let id = new Date().getTime() + '|' + randomDigits(5)

                  while (dbProxyQueue[id]) {
                    id = new Date().getTime() + '|' + randomDigits(5)
                  }
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

const randomDigits = (n: number) => {
  return Math.floor(Math.random() * (9 * Math.pow(10, n))) + Math.pow(10, n)
}
