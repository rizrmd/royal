import find from 'lodash.find'
import { dbsList } from '../../../../../app/web/types/dbs-list'
import { waitUntil } from 'web-utils'
export const initDbs = () => {
  const w = window as any
  dbsList.map((dbname) => {
    w[dbname] = new Proxy(
      {},
      {
        get(_, name) {
          const w: any = window

          let baseUrl = ''
          if (!w.is_dev && w.hostname) {
            baseUrl = `${w.hostname}`
          }

          const post = async (params: any) => {
            let url = `${baseUrl}/__data/${toSnake(params.action)}`

            if (params.table) {
              url += `...${params.table}`
            }

            const options = {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'text/plain', // kalau ga ini ga bisa ke post sama chrome >.<
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

              w.global = w
              if (!w.sodium) {
                w.sodium = (await import('sodium-universal')).default
              }
              if (!w.Buffer) {
                w.Buffer = (await w.loadExt('dev/buffer.js')).buffer.Buffer
              }

              if (typeof w.secret === 'object' && w.secret.data) {
                w.secret = w.secret.data
              }
              var nonce = w.Buffer.alloc(w.sodium.crypto_secretbox_NONCEBYTES)
              var key = w.Buffer.from(w.secret)
              var message = w.Buffer.from(q)
              var result = w.Buffer.alloc(
                message.length + w.sodium.crypto_secretbox_MACBYTES
              )

              w.sodium.randombytes_buf(nonce)
              w.sodium.crypto_secretbox_easy(result, message, nonce, key)
              let url = `${baseUrl}/__data/query`

              const options = {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'text/plain',
                  'x-nonce': nonce.toString('hex'),
                },
                body: result,
              }

              const res = await fetch(url, options)
              return await res.json()

              return []
            }
          }

          return new Proxy(
            {},
            {
              get(_, sname) {
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
                      localStorage[`dbdef-${name.toString()}`]
                    ) {
                      w.tableDefinitions[key] = JSON.parse(
                        localStorage[`dbdef-${name.toString()}`]
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
                    localStorage[`dbdef-${name.toString()}`] =
                      JSON.stringify(result)
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
