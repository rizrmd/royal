import { BaseClient } from 'boot/dev/config-parse'
import { exists } from 'fs-jetpack'
import { createApp, createRouter, IncomingMessage, ServerResponse } from 'h3'
import { dirname, join } from 'path'
import { dbs } from 'server-db'
import { declareAPI } from 'web-init/src/api'
import { web } from '../start-server'

type IServeApiArgs = {
  app: ReturnType<typeof createApp>
  name: string
  client: BaseClient
  mode: 'dev' | 'prod'
}

let cachedApiArgs = {} as IServeApiArgs
export const serveApi = (arg?: Partial<IServeApiArgs>) => {
  if (arg) {
    for (let [k, value] of Object.entries(arg)) {
      ;(cachedApiArgs as any)[k] = value
    }
  }
  let { app, name, client, mode } = cachedApiArgs
  const apijs = join(join(dirname(__filename), '..'), name, 'api.js')

  if (exists(apijs)) {
    if (!web.clients[name]) {
      web.clients[name] = { api: undefined }
    }
    const cn = web.clients[name]

    if (mode === 'dev') {
      delete require.cache[apijs]
    }
    const apiModule = require(apijs).default

    if (cn.api) {
      let is = app.stack.length
      while (is--) {
        if (app.stack[is].handler === cn.api.handler) {
          app.stack.splice(is, 1)
          break
        }
      }
    }

    cn.api = createRouter()

    if (typeof cn.api === 'object') {
      for (let arg of Object.values(apiModule) as any) {
        const url = arg[0] as string
        const handler = arg[1] as Parameters<typeof declareAPI>[1]
        cn.api.use(url, (req, reply, _) => {
          const _req = req as IncomingMessage & { body: any }
          const _reply = reply as ServerResponse & { send: (s: any) => void }
          _reply.send = (s) => {
            if (typeof s === 'object') {
              reply.setHeader('content-type', 'application/json')
              reply.write(JSON.stringify(s))
            } else {
              reply.write(s)
            }
            reply.end()
          }
          handler({
            baseurl: client.url,
            db: dbs['db'],
            ext: {},
            mode,
            reply: _reply,
            req: _req,
            session: {},
          })
        })
      }

      app.use(cn.api)
      if (app.stack.length > 1) {
        const apihandler = app.stack.pop()
        if (apihandler) {
          app.stack.unshift(apihandler)
        }
      }
    }
  }
}
