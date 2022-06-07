import { ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'
import { createProxy } from 'http-proxy'
import trim from 'lodash.trim'

export const setupDevProxy = async (
  app: ReturnType<typeof createApp>,
  config: ParsedConfig,
  url: string,
  port: number,
  name: string
) => {
  const surl = config.server.url;
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

    const type = pres.headers['content-type']?.toLowerCase()
    if (type && type.indexOf('html') >= 0) {
      let html = ''
      res.write('')

      pres.on('data', (r: Buffer) => {
        html += r.toString('utf-8')
      })
      pres.on('end', () => {
        const idx = html.lastIndexOf('</body>')
        html =
          html.substring(0, idx) +
          `\
    <script>
      window.baseurl = "${trim(url, '/')}";
      window.serverurl = "${trim(surl, '/')}";
    </script>` +
          html.substring(idx)

        res.write(html)
        res.end()
      })
    }
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
