import { ParsedConfig } from 'boot/dev/config-parse'
import type import_dbs from 'dbs'
import { IDBMsg } from '../../web/src/routes/serve-db'

type IClientSend = (args: Partial<IDBMsg>) => Promise<any>

export const dbsClient = async (
  type: 'http' | 'cluster' | 'direct',
  dbList: string[]
): Promise<typeof import_dbs> => {
  const result = {} as any

  for (let db of dbList) {
    result[db] = dbClient(
      db,
      { http: httpClient, direct: directClient, cluster: clusterClient }[type]
    )
  }

  return result
}

const httpClient: IClientSend = async (args) => {}
const directClient: IClientSend = async (args) => {}
const clusterClient: IClientSend = async (args) => {}

const dbClient = (name: string, send: IClientSend) => {
  return new Proxy(
    {},
    {
      get(_, table: string) {
        if (table === 'query') {
          return (...params: any[]) => {
            return send({
              db: name,
              action: 'query',
              params,
            })
          }
        }
        if (table === 'definition') {
          return (table: string) => {
            return send({
              db: name,
              action: 'definition',
              table,
            })
          }
        }

        return new Proxy(
          {},
          {
            get(_, action: string) {
              return (...params: any[]) => {
                return send({
                  db: name,
                  action,
                  table,
                  params,
                })
              }
            },
          }
        )
      },
    }
  )
}
