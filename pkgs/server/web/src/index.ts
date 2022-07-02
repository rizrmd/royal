import type { ParsedConfig } from 'boot/dev/config-parse'
import cluster, { Worker } from 'cluster'
import pad from 'lodash.pad'
import serverDb from 'server-db'
import { log, prettyError } from 'server-utility'
import { getAppServer } from './app-server'
import { dbResultQueue } from './routes/serve-db'
import { startCluster } from './start-cluster'
import { startServer, web } from './start-server'
export * from './types'
import get from 'lodash.get'
import { getDbProxy } from './db/db-proxy'

prettyError()

export type IServerInit = {
  action: 'init' | 'kill' | 'reload' | 'db.result'
  name?: string
  config: ParsedConfig
  mode: 'dev' | 'prod' | 'pkg'
  parentStatus?: IPrimaryWorker['status']
  dbResult?: {
    id: string
    result: any
  }
}

export type IPrimaryWorker = {
  status: 'init' | 'ready' | 'stopping'
  child: Record<number, Worker>
  clusterSize: number
  config: ParsedConfig
  mode: 'dev' | 'prod' | 'pkg'
}

if (cluster.isWorker) {
  const worker = cluster.worker
  if (worker) {
    worker.on('message', async (data: IServerInit) => {
      const id = process.env.id

      if (data.action === 'init') {
        await startServer(data.config, data.mode)

        log(
          `[${pad(`wrk-${id}`, 7)}]  🍃 Back End Worker #${id} ${
            data.parentStatus === 'init' ? 'started' : 'reloaded'
          } (pid:${process.pid})`
        )
      } else if (data.action === 'kill') {
        if (web.server) {
          web.server.on('close', () => {
            worker?.destroy()
          })
          if (web.server.listening) {
            web.server.close()
          } else {
            worker?.destroy()
          }
        } else {
          process.exit(1)
        }
      } else if (data.action === 'db.result') {
        if (data.dbResult) {
          const queue = dbResultQueue[data.dbResult.id]
          if (queue) {
            dbResultQueue[data.dbResult.id].result(data.dbResult.result)
          }
        }
      }
    })
  }
} else {
  if (process.send) {
    ;(async () => {
      const worker = {
        status: 'init',
        child: {},
        clusterSize: 0,
      } as IPrimaryWorker

      process.on('message', async (data: IServerInit) => {
        if (data.action === 'init') {
          await serverDb.start(data.config)

          worker.config = data.config
          worker.mode = data.mode

          const db = getDbProxy(data.mode, 'db')

          await startCluster(worker)

          const gapp = await getAppServer()

          const onInitRoot = get(gapp, 'events.root.init')
          if (onInitRoot) {
            onInitRoot(worker)
          }

          worker.status = 'ready'
          if (process.send)
            process.send({ event: 'started', url: data.config.server.url })
        }

        if (data.action === 'reload') {
          if (worker.status === 'ready') {
            for (let wk of Object.values(worker.child)) {
              wk.send({ action: 'kill' })
            }
          }
        } else if (data.action.startsWith('reload.')) {
          if (worker.status === 'ready') {
            for (let wk of Object.values(worker.child)) {
              wk.send(data)
            }
          }
        }

        if (data.action === 'kill') {
          await serverDb.stop()

          worker.status = 'stopping'
          const killings = [] as Promise<void>[]
          for (let wk of Object.values(worker.child)) {
            wk.send({ action: 'kill' })
            killings.push(
              new Promise((killed) => {
                wk.once('disconnect', killed)
                wk.once('exit', killed)
              })
            )
          }

          await Promise.all(killings)
          process.exit(1)
        }
      })
    })()
  }
}
