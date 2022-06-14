import { ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'
import { createProxy } from 'http-proxy'
import trim from 'lodash.trim'
import { Writable } from 'stream'

export const setupDevProxy = async (
  app: ReturnType<typeof createApp>,
  config: ParsedConfig,
  url: string,
  port: number,
  name: string
) => {
  const surl = config.server.url
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

    if (
      req.method === 'GET' &&
      (!type || (type && type.indexOf('html') >= 0))
    ) {
      const _write = res.write
      const _end = res.end
      let html = ''
      res.write = function (body: Buffer, ...args: any[]) {
        html += body.toString('utf-8')

        return true
      }
      res.end = function () {
        const idx = html.lastIndexOf('</body>')
        const injectHtml = `\
<script>
  window.baseurl = "${trim(url, '/')}";
  window.serverurl = "${trim(surl, '/')}";
</script>`
        html = html.substring(0, idx) + injectHtml + html.substring(idx)

        const len = res.getHeader('content-length') || 0
        if (typeof len === 'string' || typeof len === 'number') {
          res.setHeader(
            'content-length',
            (injectHtml.length + Number(len)).toString()
          )
        }

        _write.bind(res)(Buffer.from(html, 'utf-8'))
        return _end.bind(res)()
      }
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
