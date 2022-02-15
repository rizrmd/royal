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
import os from 'os'
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

const args = arg({})
const mode = args._[0] as 'prod' | 'prod-debug' | 'dev' | 'dev-debug'
const port = args._[1]

export const start = async (
  port: string,
  _mode: 'prod' | 'prod-debug' | 'dev' | 'dev-debug'
) => {
  const server = Fastify()

  const mode = _mode.replace('-debug', '') as 'prod' | 'dev'
  const debug = _mode.indexOf('-debug') > 0

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
  }

  server.register(fastCookie)
  server.register(authPlugin)
  server.register(jsonPlugin)

  await router(server, mode)

  server.listen(port, '0.0.0.0', function (err, address) {
    if (!err) {
      const hostname = resolveHostname(undefined)
      if (!debug) {
        clearScreen()
        welcomeToBase(mode, parseInt(port))
      }
      Object.values(os.networkInterfaces())
        .flatMap((nInterface) => nInterface ?? [])
        .filter(
          (detail) => detail && detail.address && detail.family === 'IPv4'
        )
        .map((detail) => {
          const type = detail.address.includes('127.0.0.1')
            ? 'Local:   '
            : 'Network: '
          const host = detail.address.replace('127.0.0.1', hostname.name)
          const url = `${'http'}://${host}:${port}`
          return `${type} ${url}`
        })
        .forEach((msg) => log('platform', msg))
    } else {
      console.log(err)
      process.exit(0)
    }
  })
}

start(port || '3200', mode)

export interface Hostname {
  // undefined sets the default behaviour of server.listen
  host: string | undefined
  // resolve to localhost when possible
  name: string
}

export function resolveHostname(
  optionsHost: string | boolean | undefined
): Hostname {
  let host: string | undefined
  if (
    optionsHost === undefined ||
    optionsHost === false ||
    optionsHost === 'localhost'
  ) {
    // Use a secure default
    host = '127.0.0.1'
  } else if (optionsHost === true) {
    // If passed --host in the CLI without arguments
    host = undefined // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    host = optionsHost
  }

  // Set host name to localhost when possible, unless the user explicitly asked for '127.0.0.1'
  const name =
    (optionsHost !== '127.0.0.1' && host === '127.0.0.1') ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === undefined
      ? 'localhost'
      : host

  return { host, name }
}
