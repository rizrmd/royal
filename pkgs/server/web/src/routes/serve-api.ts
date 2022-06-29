import { ParsedConfig } from 'boot/dev/config-parse'
import { createApp, useBody } from 'h3'
import { API } from '..'
import { getDbProxy, getDbsProxy } from '../db/db-proxy'

export type IServeApiArgs = {
  app: ReturnType<typeof createApp>
  mode: 'dev' | 'prod' | 'pkg'
  config: ParsedConfig
  api: Record<string, API>
}

let cachedApiArgs = {} as IServeApiArgs
export const serveApi = async (arg?: Partial<IServeApiArgs>) => {
  if (arg) {
    for (let [k, value] of Object.entries(arg)) {
      ;(cachedApiArgs as any)[k] = value
    }
  }
  let { api, app, mode, config } = cachedApiArgs

  for (let [k, v] of Object.entries(api)) {
    const [url, handler] = v
    app.use(url, async (req, reply, next) => {
      const _req = req as any
      const _reply = reply as any

      _req.body = await useBody(req)
      _reply.send = (msg: any) => {
        reply.write(msg)
        reply.end()
      }

      await handler({
        req: _req,
        reply: _reply,
        ext: {},
        mode,
        baseurl: config.server.url,
        db: await getDbProxy(mode, 'db'),
        dbs: await getDbsProxy(mode),
        session: {},
      })
    })
  }
}
