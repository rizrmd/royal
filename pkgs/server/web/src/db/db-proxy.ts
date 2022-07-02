import get from 'lodash.get'
import { join } from 'path'
import { dbResultQueue, IDBMsg } from '../routes/serve-db'

import { dbsList } from '../../../../../app/web/types/dbs-list'

export const getDbProxy = (mode: 'dev' | 'prod' | 'pkg', dbname: string) => {
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
                  const body: IDBMsg = {
                    action: action.toString(),
                    db: dbname.toString(),
                    params,
                    table: table.toString(),
                  }
                  if (mode !== 'pkg' && process.send) {
                    let id = new Date().getTime() + '' + randomDigits(5)
                    while (dbResultQueue[id]) {
                      id = new Date().getTime() + '' + randomDigits(5)
                    }
                    const resultPromise = new Promise<any>((result) => {
                      dbResultQueue[id] = { arg: body, result }
                    })
                    resultPromise.then((result: any) => {
                      delete dbResultQueue[id]
                      resolve(result)
                    })
                    process.send({ action: 'db.query', id, arg: body })
                    await resultPromise
                  } else {
                    const im = join(__dirname, 'pkgs', 'dbs', 'db', 'db.js')
                    const db = require(im).db
                    const func = get(db, `${body.table}.${body.action}`)
                    if (typeof func === 'function') {
                      resolve(await func(...body.params))
                    }
                  }
                })
              }
            },
          }
        )
      },
    }
  )
}

export const getDbsProxy = async (mode: 'dev' | 'prod' | 'pkg') => {
  const result = {} as any
  for (let i of dbsList) {
    result[i] = getDbProxy(mode, i)
  }

  return result
}

export const randomDigits = (n: number) => {
  return Math.floor(Math.random() * (9 * Math.pow(10, n))) + Math.pow(10, n)
}
