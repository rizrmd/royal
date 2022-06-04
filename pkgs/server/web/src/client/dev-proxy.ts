import { ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'
import { createProxy } from 'http-proxy'

export const setupDevProxy = async (
  app: ReturnType<typeof createApp>,
  config: ParsedConfig,
  url: string,
  port: number
) => {
  const route = url.substring(config.server.url.length)
  const proxy = createProxy({
    target: `http://127.0.0.1:${port}`,
    changeOrigin: true,
    followRedirects: true,
    autoRewrite: true,
    hostRewrite: route,
    ws: true,
  })
  
  proxy.on('proxyRes', (pres, req, res) => {
    if (pres.statusCode) res.statusCode = pres.statusCode
  })

  app.use({
    route,
    handler: (req, res) => {
      return new Promise<void>((resolve) => {
        proxy.web(req, res, {}, () => {
          resolve()
        })
      })
    },
  })
}
