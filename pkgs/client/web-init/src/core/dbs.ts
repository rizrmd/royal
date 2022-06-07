import find from 'lodash.find'
import { dbsList } from '../../../../../app/web/types/dbs-list'
import { encrypt, waitUntil } from 'web-utils'
export const initDbs = () => {
  const w = window as any
  dbsList.map((dbname) => {
    w[dbname] = new Proxy(
      {},
      {
        get(_, name) {
          const w = window

          const post = async (params: any) => {
            let url = `${w.serverUrl}/__data/${toSnake(params.action)}`

            if (params.table) {
              url += `...${params.table}`
            }

            const options = {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'text/plain',
              },
              body: JSON.stringify(params),
            }

            const fetching = await fetch(url, options)
            return await fetching.json()
          }

          if (name === 'query') {
            return async (q: string | [string, Record<string, any>]) => {
              // todo: process parameterized query
              if (Array.isArray(q)) return []
              const encrypted = await encrypt(q)

              let url = `${w.serverUrl}/__data/query`
              const options = {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'text/plain',
                  'x-sid': w.auth.user.encryptedSessionId,
                },
                body: encrypted,
              }

              const res = await fetch(url, options)
              return await res.json()
            }
          }

          return new Proxy(
            {},
            {
              get(_, sname) {
                if (!w.dbDefinitions) {
                  w.dbDefinitions = {}
                }
                const ls = w.dbDefinitions
                const lskey = ((w.auth || {}).sid || '').substring(0, 5) + '--'
                if (sname === isProxy) return true
                return async function (this: any, ...params: any[]) {
                  const w = window as any

                  const key = `${dbname}.${name.toString()}`
                  if (sname === 'definition') {
                    if (!w.tableDefinitions) {
                      w.tableDefinitions = {}
                    }

                    if (
                      !(window as any).is_dev &&
                      ls[`${lskey}${name.toString()}`]
                    ) {
                      w.tableDefinitions[key] = JSON.parse(
                        ls[`${lskey}${name.toString()}`]
                      )
                    }

                    if (w.tableDefinitions[key]) {
                      await waitUntil(
                        () => w.tableDefinitions[key] !== 'loading'
                      )
                      return w.tableDefinitions[key]
                    }

                    w.tableDefinitions[key] = 'loading'
                  }

                  const result = await post({
                    table: name,
                    db: dbname,
                    action: sname,
                    params,
                  })

                  if (result && result.status === 'failed' && result.reason) {
                    throw new Error(
                      `db.${name.toString()}.${sname.toString()}() ${
                        result.reason
                      }`
                    )
                  }

                  if (sname === 'definition') {
                    for (let [k, val] of Object.entries(
                      result.columns
                    ) as any) {
                      val.type = val.type.toLowerCase()
                    }
                    const pk = find(result.columns, { pk: true })
                    result.pk = pk.name
                    w.tableDefinitions[key] = result
                    ls[`${lskey}${name.toString()}`] = JSON.stringify(result)
                  }

                  if (w.dbDelay) {
                    await waitUntil(w.dbDelay)
                  }

                  return result
                }
              },
            }
          )
        },
      }
    )
  })
}

const isProxy = Symbol('isProxy')

const toSnake = (str: string) =>
  str[0].toLowerCase() +
  str
    .slice(1, str.length)
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

const replaceNullWithUndefined = (data: any) => {
  if (typeof data === 'object') {
    for (let [k, v] of Object.entries(data)) {
      if (v === null) {
        data[k] = undefined
      } else if (typeof v === 'object') {
        replaceNullWithUndefined(v)
      }
    }
  }
}
