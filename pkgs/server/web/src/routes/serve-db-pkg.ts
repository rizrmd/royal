import { useBody } from 'h3'
import * as serverDb from 'server-db'
import { IDBMsg, IServeDbArgs } from './serve-db'

export const serveDbPkg = async (arg: Partial<IServeDbArgs>) => {
  const { app } = arg


  if (app) {
    app.use('/__data', async (req, res, next) => {
      const body = (await useBody(req)) as IDBMsg

      const dbResult = await serverDb.forkQuery(body)
      if (dbResult) {
        res.setHeader('content-type', 'application/json')
        res.write(JSON.stringify(dbResult))
        res.end()
      } else {
        res.statusCode = 403
        res.setHeader('content-type', 'application/json')
        res.write(JSON.stringify({ status: 'forbidden' }))
      }
    })
  }
}
