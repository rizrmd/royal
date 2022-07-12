import type { ParsedConfig } from 'boot/dev/config-parse'
import cluster, { Worker } from 'cluster'
import get from 'lodash.get'
import pad from 'lodash.pad'
import * as serverDb from 'server-db'
import { log, logUpdate, prettyError } from 'server-utility'
import { getAppServer } from './app-server'
import { IDBMsg } from './routes/serve-db'
import { startCluster } from './start-cluster'
import { startWorkerHttp, web } from './start-worker-http'
export * from './types'
import { g } from './types'

prettyError()

export type IServerInit = {
  action: 'init' | 'kill' | 'reload' | 'db.query' | 'db.result'
  name?: string
  config: ParsedConfig
  mode: 'dev' | 'prod' | 'pkg'
  parentStatus?: IClusterParent['status']
  db?: {
    id: string
    result?: any
    query?: IDBMsg
  }
}

export type IClusterParent = {
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
        await startWorkerHttp(data.config, data.mode, `${id || 0}`)
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
        const dbQueue = (global as any).dbQueue
        if (data.db && dbQueue[data.db.id]) {
          dbQueue[data.db.id](data.db.result)
          delete dbQueue[data.db.id]
        }
      }
    })
  }
} else {
  if (process.send) {
    ;(async () => {
      const parent = {
        status: 'init',
        child: {},
        clusterSize: 0,
      } as IClusterParent

      process.on('message', async (data: IServerInit) => {
        if (data.action === 'init') {
          await serverDb.startDBFork(data.config)

          parent.config = data.config
          parent.mode = data.mode

          await startCluster(parent)
          const gapp = await getAppServer()

          const onInitRoot = get(gapp, 'events.root.init')

          if (onInitRoot) {
            g.dbs = await serverDb.dbsClient(
              'fork',
              Object.keys(data.config.dbs)
            )
            g.db = g.dbs['db']

            await onInitRoot(parent)
            if (data.mode === 'dev') {
              console.log('')
            }
          }

          parent.status = 'ready'
          if (process.send)
            process.send({ event: 'started', url: data.config.server.url })
        }

        if (data.action === 'db.query' && data.db && data.db.query) {
          serverDb.forkQuery(data.db.query)
        }

        if (data.action === 'reload') {
          if (parent.status === 'ready') {
            for (let wk of Object.values(parent.child)) {
              wk.send({ action: 'kill' })
            }
          }
        } else if (data.action.startsWith('reload.')) {
          if (parent.status === 'ready') {
            for (let wk of Object.values(parent.child)) {
              wk.send(data)
            }
          }
        }

        if (data.action === 'kill') {
          await serverDb.stopDBFork()

          parent.status = 'stopping'
          const killings = [] as Promise<void>[]
          for (let wk of Object.values(parent.child)) {
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
