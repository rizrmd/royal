import { ParsedConfig } from 'boot/dev/config-parse'

import { createApp, useBody } from 'h3'
import camelCase from 'lodash.camelcase'
import trim from 'lodash.trim'
// import serverDb from 'server-db'

export type IServeDbArgs = {
  workerId: string
  app: ReturnType<typeof createApp>
  config: ParsedConfig
  mode: 'dev' | 'prod' | 'pkg'
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

export const serveDb = (arg: Partial<IServeDbArgs>) => {
  const { app, workerId } = arg

  if (app) {
    app.use('/__data', async (req, res, next) => {
      const [action, table] = (
        trim(req.url, '/').split('/').shift() || ''
      ).split('...')

      const body = (await useBody(req)) as IDBMsg

      if (
        body.table === table &&
        camelCase(action) === body.action &&
        workerId
      ) {
        if (process.send) {
          res.setHeader('content-type', 'application/json')

          // res.write(
          //   JSON.stringify(
          //     await serverDb.sendQueryToParentCluster(body, workerId)
          //   )
          // )
          res.end()
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

export const randomDigits = (n: number) => {
  return Math.floor(Math.random() * (9 * Math.pow(10, n))) + Math.pow(10, n)
}
