import type { ParsedConfig } from 'boot/dev/config-parse'
import cluster, { Worker } from 'cluster'
import pad from 'lodash.pad'
import serverDb from 'server-db'
import { log, logUpdate, prettyError } from 'server-utility'
import { getAppServer } from './app-server'
import { serveApi } from './client/serve-api'
import { dbResultQueue } from './client/serve-db'
import { startCluster } from './start-cluster'
import { startServer, web } from './start-server'
export * from './types'

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
          web.server.close()
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
          await startCluster(worker)

          const gapp = await getAppServer()

          if (gapp && gapp['init']) {
            gapp.init(worker)
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
