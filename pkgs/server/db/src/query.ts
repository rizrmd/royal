import { Worker } from 'cluster'
import { generateQueueID } from './util'
import { IDBMsg } from '../../web/src/routes/serve-db'
import { define } from './fork'

// @ts-ignore
import type APIQuery from '../../../../app/server/src/query'

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
  const g = global as any & { apiQuery: typeof APIQuery }

  return new Promise(async (resolve) => {
    const name = body.db

    if (forks[name]) {
      if (body.action === 'query' && !body.table.startsWith('$')) {
        if (g.app && g.app.query) {
          const q = (await g.app.query).default
          if (q[body.db] && q[body.db][body.table]) {
          
            const result = await q[body.db][body.table](body.params)
            resolve(result)
            return
          }
        }
        resolve(null)
        return
      }

      const id = generateQueueID(dbQueue, prefix || 'fork')
      dbQueue[id] = resolve
      forks[name].send({ ...body, id })
    } else {
      resolve(undefined)
    }
  })
}
