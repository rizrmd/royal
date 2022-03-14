import arg from 'arg'
import { log, welcomeToBase } from 'boot'
import crypto from 'crypto'
import Fastify, { RouteOptions } from 'fastify'
import fastCookie from 'fastify-cookie'
import os from 'os'
import PrettyError from 'pretty-error'
import { settings } from 'src'
import { declareApi } from './api/platform-api'
import { startDev } from './dev'
import { jsonPlugin } from './json'
import { router } from './routes'
import { authPlugin } from './session/session-register'
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

PrettyError.start()

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

  const hostname = resolveHostname(undefined)
  const localIP = Object.values(os.networkInterfaces())
    .flatMap((nInterface) => nInterface ?? [])
    .filter((detail) => detail && detail.address && detail.family === 'IPv4')
    .map((e) => e.address)

  settings.localIP = localIP
  settings.mode = mode

  settings.sidkey = crypto.createHash('md5').update(process.cwd()).digest('hex')
  server.register(fastCookie)
  server.register(authPlugin)
  server.register(jsonPlugin)

  await declareApi(server, mode)

  if (mode === 'dev') {
    await startDev({ server })
  }
  await router(server, mode, port)

  server.listen(port, '0.0.0.0', function (err, address) {
    if (!err) {
      welcomeToBase(mode, parseInt(port))
      localIP
        .map((address) => {
          const type = address.includes('127.0.0.1') ? 'Local:   ' : 'Network: '
          const host = address.replace('127.0.0.1', hostname.name)
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
