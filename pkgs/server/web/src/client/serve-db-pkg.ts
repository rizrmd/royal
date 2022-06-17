import { useBody } from 'h3'
import camelCase from 'lodash.camelcase'
import trim from 'lodash.trim'
import { IDBMsg, IServeDbArgs, randomDigits } from './serve-db'
import get from 'lodash.get'

export const serveDbPkg = async (arg: Partial<IServeDbArgs>) => {
  const dbs = (await import('../../../../../app/dbs/dbs')).default
  const { app, config, mode } = arg

  if (app) {
    app.use('/__data', async (req, res, next) => {
      const [action, table] = (
        trim(req.url, '/').split('/').shift() || ''
      ).split('...')

      const body = (await useBody(req)) as IDBMsg

      if (body.table === table && camelCase(action) === body.action) {
        res.setHeader('content-type', 'application/json')
        const func = get(dbs, `${body.db}.${body.table}.${body.action}`)
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
