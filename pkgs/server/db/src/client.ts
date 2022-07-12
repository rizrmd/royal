import { forkSend, fetchSend, proxyClusterSend } from 'client-send'
import type import_dbs from 'dbs'
import { IDBMsg } from '../../web/src/routes/serve-db'

export type IClientSend = (msg: IDBMsg, args?: IDBClientArg) => Promise<any>

export type IDBClientArg = { workerId?: string }
export const dbsClient = async (
  type: 'fetch' | 'proxy-cluster' | 'fork',
  dbList: string[],
  args?: IDBClientArg
): Promise<typeof import_dbs> => {
  const result = {} as any

  for (let db of dbList) {
    result[db] = dbClient(
      db,
      {
        fetch: fetchSend,
        'proxy-cluster': proxyClusterSend,
        fork: forkSend,
      }[type],
      args
    )
  }

  return result
}

const dbClient = (name: string, send: IClientSend, args?: IDBClientArg) => {
  return new Proxy(
    {},
    {
      get(_, table: string) {
        if (table === 'query') {
          return (sql: string, ...params: any[]) => {
            console.log('query', params)
            return {}
            // return send(
            //   {
            //     db: name,
            //     action: 'query',
            //     table: undefined,
            //     params,
            //   },
            //   args
            // )
          }
        }
        if (table === 'definition') {
          return (table: string) => {
            console.log('definition', table)
            return {}

            return send(
              {
                db: name,
                action: 'definition',
                table,
                params: undefined,
              },
              args
            )
          }
        }

        return new Proxy(
          {},
          {
            get(_, action: string) {
              return (...params: any[]) => {
                return send(
                  {
                    db: name,
                    action,
                    table,
                    params,
                  },
                  args
                )
              }
            },
          }
        )
      },
    }
  )
}
