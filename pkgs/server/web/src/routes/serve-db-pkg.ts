import { useBody } from 'h3'
import camelCase from 'lodash.camelcase'
import get from 'lodash.get'
import trim from 'lodash.trim'
import { join } from 'path'
import { IDBMsg, IServeDbArgs } from './serve-db'

export const serveDbPkg = async (arg: Partial<IServeDbArgs>) => {
  const im = join(__dirname, 'pkgs', 'dbs', 'db', 'db.js')
  const db = require(im).db
  const { app, config, mode } = arg

  if (app) {
    if (db['$connect']) {
      await db['$connect']()
    }
    app.use('/__data', async (req, res, next) => {
      const [action, table] = (
        trim(req.url, '/').split('/').shift() || ''
      ).split('...')

      const body = (await useBody(req)) as IDBMsg

      if (body.table === table && camelCase(action) === body.action) {
        res.setHeader('content-type', 'application/json')
        const func = get(db, `${body.table}.${body.action}`)
        if (typeof func === 'function') {
          res.write(JSON.stringify(await func(...body.params)))
        }

        return
      }
      res.statusCode = 403
      res.setHeader('content-type', 'application/json')
      res.write(JSON.stringify({ status: 'forbidden' }))
      res.end()
    })
  }
}
