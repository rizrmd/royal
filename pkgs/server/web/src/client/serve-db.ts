import { ParsedConfig } from 'boot/dev/config-parse'
import cluster from 'cluster'
import { createApp, ServerResponse, useBody } from 'h3'
import camelCase from 'lodash.camelcase'
import trim from 'lodash.trim'

export type IServeDbArgs = {
  app: ReturnType<typeof createApp>
  config: ParsedConfig
  mode: 'dev' | 'prod'
}

export type IDBMsg = {
  table: string
  db: string
  action: string
  params: Partial<{
    where: any
    orderBy: any
    take: any
    include: any
    data: any
  }>[]
}

export const dbResultQueue = {} as Record<
  string,
  { arg: IDBMsg; result: (value: any) => void }
>

export const serveDb = (arg: Partial<IServeDbArgs>) => {
  const { app, config, mode } = arg

  if (app) {
    app.use('/__data', async (req, res, next) => {

      const [action, table] = (
        trim(req.url, '/').split('/').shift() || ''
      ).split('...')

      const body = (await useBody(req)) as IDBMsg

      if (body.table === table && camelCase(action) === body.action) {
        if (process.send) {
          let id = new Date().getTime() + '' + randomDigits(5)
          while (dbResultQueue[id]) {
            id = new Date().getTime() + '' + randomDigits(5)
          }

          const resultPromise = new Promise<any>((result) => {
            dbResultQueue[id] = { arg: body, result }
          })
          resultPromise.then((result: any) => {
            res.setHeader('content-type', 'application/json')
            res.write(JSON.stringify(result))
            res.end()
            delete dbResultQueue[id]
          })
          process.send({ action: 'db.query', id, arg: body })
          await resultPromise
          return
        }
      }
      res.statusCode = 403
      res.setHeader('content-type', 'application/json')
      res.write(JSON.stringify({ status: 'forbidden' }))
      res.end()
    })
  }
}

const randomDigits = (n: number) => {
  return Math.floor(Math.random() * (9 * Math.pow(10, n))) + Math.pow(10, n)
}
