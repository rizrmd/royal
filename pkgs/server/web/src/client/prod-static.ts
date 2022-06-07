import { ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'
import { join } from 'path'
import send from 'send'

export const setupProdStatic = async (
  app: ReturnType<typeof createApp>,
  config: ParsedConfig,
  url: string,
  name: string
) => {
  const root = join(process.cwd(), 'client', name)
  if (url.startsWith(config.server.url)) {
    const route = url.substring(config.server.url.length)

    app.use(route, (req, res, next) => {
      send(req, join(root, req.url || ''), {
        index: false,
      })
        .on('error', (e) => {
          send(req, join(root, 'index.html')).pipe(res)
        })
        .pipe(res)
    })
  }
}
