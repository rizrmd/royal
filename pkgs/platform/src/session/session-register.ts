import { log } from 'boot'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fastifySession from './lib'
import Store from './lib/store'
import crypto from 'crypto'

export const authPlugin = fp(function (
  server: FastifyInstance,
  _: any,
  next: () => void
) {
  try {
    server.register(fastifySession, {
      secret:
        'XDGKpja1kog7xuGU1lFzKDFvTY3PbBIn0B5BTAhoGz7daATEKUDOTn0nxUJ5tW9Z',
      store: new Store(),
      cookie: {},
      cookieName: crypto.createHash('md5').update(process.cwd()).digest('hex'),
    })
    server.addHook('onResponse', (req: any) => {
      if (req.session.authenticated === false) {
        req.destroySession(() => {})
      }
    })
  } catch (e: any) {
    log('platform', `Failed to initialize session: ${e.toString()}`)
  }
  next()
})
