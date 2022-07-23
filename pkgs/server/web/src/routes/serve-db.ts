import { ParsedConfig } from 'boot/dev/config-parse'

import { createApp, useBody } from 'h3'
import * as serverDb from 'server-db'

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
      const body = (await useBody(req)) as IDBMsg

      if (workerId) {
        const dbResult = await serverDb.clusterQuery(body, workerId)
        if (dbResult !== undefined) {
          res.setHeader('content-type', 'application/json')
          res.write(JSON.stringify(dbResult))
          res.end()
          return
        }
      }

      res.statusCode = 403
      res.setHeader('content-type', 'application/json')
      res.write(JSON.stringify({ status: 'forbidden' }))
    })
  }
}
