import cluster from 'cluster'
import os from 'os'
import { IPrimaryWorker } from '..'
import { IDBMsg } from './client/serve-db'
import { dbs } from 'server-db'
import { log } from 'server-utility'
const MAX_CLUSTER_PROCESS = os.cpus().length

export const startCluster = (worker: IPrimaryWorker) => {
  return new Promise<void>((started) => {
    const clusterSize = Math.min(
      MAX_CLUSTER_PROCESS,
      worker.config.server.worker
    )
    worker.clusterSize = clusterSize

    for (let i = 0; i < clusterSize; i++) {
      cluster.fork({ id: i + 1 })
    }

    cluster.on('online', (wk) => {
      worker.child[wk.id] = wk
      wk.send({ config: worker.config, mode: worker.mode, action: 'init' })

      if (Object.keys(worker.child).length >= clusterSize) {
        started()
      }
    })

    cluster.on('message', async (wk, msg, socket) => {
      if (msg && msg.action === 'db.query') {
        const { id, arg } = msg as { id: string; arg: IDBMsg }
        const db = (dbs as any)[arg.db]

        if (!db) {
          log(
            `WARNING: app/dbs/${arg.db} not found, are you sure has defined "${arg.db} entry on config.ts?`
          )
          return
        }

        const table = db[arg.table]

        if (table) {
          const action = table[arg.action]
          if (action) {
            const result = await action(...arg.params)
            const pkt = { dbResult: { id, result }, action: 'db.result' }
            wk.send(pkt)
          }
        }
      }
    })

    cluster.on('exit', (wk, code, singal) => {
      if (worker.status !== 'stopping') {
        cluster.fork({
          id: Object.keys(worker.child).indexOf(wk.id.toString()) + 1,
        })
      }
      delete worker.child[wk.id]
    })
  })
}
