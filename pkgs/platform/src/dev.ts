import { dirs } from 'boot'
import { FastifyInstance } from 'fastify'
import fastProxy from 'fastify-http-proxy'
import { pathExists, readFile, readJson, writeJson } from 'fs-extra'
import fetch from 'node-fetch'
import { join } from 'path'
import { settings } from 'src'
import baseUrl from '../../../app/web/src/baseurl'

type IStartDev = {
  server: FastifyInstance
}
export const startDev = async ({ server }: IStartDev) => {
  const vitePortFile = join(dirs.app.web, 'node_modules', 'viteport')
  const vitePort = (await readFile(vitePortFile)) || '3200'
  let html = ''

  const capConfigFile = join(dirs.app.mobile, 'capacitor.config.json')
  if (await pathExists(capConfigFile)) {
    const json = await readJson(capConfigFile)
    const url = baseUrl({ mode: settings.mode, ips: [...settings.localIP] })
    json.server = { url }
    await writeJson(capConfigFile, json, { spaces: 2 })
  }

  try {
    const res = await fetch(`http://localhost:${vitePort}`)
    html = await res.text()
    html = html.replace(
      '</html>',
      `\
<script>
  window.ips = ${JSON.stringify(settings.localIP)};
  window.mode = ${JSON.stringify(settings.mode)};
  window.sidkey = ${JSON.stringify(settings.sidkey)};
</script>
</html>`
    )
  } catch (e) {
    console.log('Failed to fetch initial html:', e)
    return
  }

  server.register(fastProxy, {
    upstream: `http://localhost:${vitePort}`,
    preHandler: async (req, reply) => {
      const accept = req.headers['accept']
      if (accept && accept.indexOf('text/html') >= 0) {
        reply.type('text/html')
        reply.send(html)
      }

      try {
        // TODO: this is still using modified fastify to expose 'router' internal.
        const route = server['router'].find(req.method, req.url, {})
        if (
          route &&
          route.store &&
          route.store.config.url !== '/*' &&
          route.store.config.url !== '/'
        ) {
          route.handler(req, reply)
        }
      } catch (e) {
        console.log(e)
      }
    },
  })
}
