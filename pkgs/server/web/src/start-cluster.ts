import cluster from 'cluster'
import os from 'os'
import { IPrimaryWorker } from '..'
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
