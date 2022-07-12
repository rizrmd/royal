import { Worker } from 'cluster'
import { generateQueueID } from './util'
import { IDBMsg } from '../../web/src/routes/serve-db'
import { define } from 'fork'

/**
 * fork
 *   forkQuery()
 *   - parent
 *      parentQuery()
 *      - cluster
 *          clusterQuery()
 */

export const clusterQuery = async (
  body: IDBMsg,
  workerId: string
): Promise<any> => {
  return new Promise((resolve) => {
    define('dbQueue', {})

    const cid = generateQueueID(dbQueue, `wk-${workerId}`)
    dbQueue[cid] = resolve
    process.send({
      action: 'db.query',
      db: { query: body, id: cid },
    })
  })
}

export const parentQuery = async (
  body: IDBMsg,
  wk: Worker,
  cid: string
): Promise<any> => {
  const result = await forkQuery(body, cid)
  wk.send({ action: 'db.result', db: { id: cid, result } })
}

export const forkQuery = (body: IDBMsg, prefix?: string): Promise<any> => {
  return new Promise((resolve) => {
    const name = body.db

    if (forks[name]) {
      const id = generateQueueID(dbQueue, prefix || 'fork')
      dbQueue[id] = resolve
      forks[name].send({ ...body, id })
    } else {
      resolve(undefined)
    }
  })
}
