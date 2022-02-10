import arg from 'arg'
import { clearScreen, dirs, log, welcomeToBase } from 'boot'
import Fastify, { RouteOptions } from 'fastify'
import fastCookie from 'fastify-cookie'
import fastProxy from 'fastify-http-proxy'
import { readFile } from 'fs-extra'
import { join } from 'path'
import { jsonPlugin } from './json'
import { router as router } from './routes'
import { authPlugin } from './session/session-register'

const args = arg({})
const mode = args._[0] as 'prod' | 'dev'
const port = args._[1]

export const start = async (port: string, mode: 'prod' | 'dev') => {
  const server = Fastify()

  const routes: RouteOptions[] = []
  server.addHook('onRoute', (route) => {
    routes.push(route)
  })
  if (mode === 'dev') {
    const vitePortFile = join(dirs.app.web, 'node_modules', 'viteport')
    const vitePort = (await readFile(vitePortFile)) || '3200'
    server.register(fastProxy, {
      upstream: `http://localhost:${vitePort}`,
      preHandler: (req, reply, done) => {
        let route = { data: null as any, path: '//' }
        // simple and dumb route matching, should be using FindMyWay route.find
        for (let r of routes) {
          const cur = r.url.replace(/\*/gi, '')
          if (req.url.startsWith(cur)) {
            if (route.path.length <= cur.length) {
              route.path = cur
              route.data = r
            }
          }
        }
        if (route.data) {
          route.data.handler(req, reply, done)
        } else {
          done()
        }
      },
    })
  } else {
  }
  server.register(fastCookie)
  server.register(authPlugin)
  server.register(jsonPlugin)

  router(server, mode)

  clearScreen()
  welcomeToBase(mode, parseInt(port))
  log('platform', `Server: http://localhost:${port}`)

  server.listen(port)
}

start(port || '3200', mode)
