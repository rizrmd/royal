import type { ParsedConfig } from 'boot/dev/config-parse'
import cluster, { Worker } from 'cluster'
import pad from 'lodash.pad'
import serverDb from 'server-db'
import { log, prettyError } from 'server-utility'
import { serveApi } from './client/serve-api'
import { startCluster } from './client/start-cluster'
import { startServer, web } from './start-server'
prettyError()

export type IServerInit = {
  action: 'init' | 'kill' | 'reload' | 'reload.api'
  name?: string
  config: ParsedConfig
  mode: 'dev' | 'prod'
}

export type IPrimaryWorker = {
  status: 'ready' | 'stopping'
  child: Record<number, Worker>
  clusterSize: number
  config: ParsedConfig
  mode: 'dev' | 'prod'
}

if (cluster.isWorker) {
  const worker = cluster.worker
  if (worker) {
    worker.on('message', async (data: IServerInit) => {
      const id = process.env.id

      if (data.action === 'init') {
        await startServer(data.config, data.mode)

        log(
          `[${pad(`wrk-${id}`, 7)}]  🍃 Back End Worker #${id} started (pid:${
            process.pid
          })`
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
      } else if (data.action === 'reload.api') {
        const name = data['name']
        if (web.app && name) {
          const client = web.clients[name]
          if (client) {
            // for (let i of Object.values(client.api) as any) {
            //   const url = i[0]
            //   let idx = web.app.stack.length
            //   while (idx--) {
            //     const stack = web.app.stack[idx]
            //     if (stack.route === url) {
            //       web.app.stack.splice(idx, 1)
            //     }
            //   }
            // }

            log(`[${pad(`wrk-${id}`, 7)}]  🍃 Reloading API Worker #${id}`)
            serveApi({ name })
          }
        }
      }
    })
  }
} else {
  if (process.send) {
    ;(async () => {
      const worker = {
        status: 'ready',
        child: {},
        clusterSize: 0,
      } as IPrimaryWorker

      process.on('message', async (data: IServerInit) => {
        if (data.action === 'init') {
          await serverDb.start(data.config)

          worker.config = data.config
          worker.mode = data.mode
          await startCluster(worker)

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
