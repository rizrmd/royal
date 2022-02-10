import { log } from 'boot'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fastifySession from './lib'
import Store from './lib/store'


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
      saveUninitialized: false,
      cookie: {
        secure: false,
        sameSite: false,
        maxAge: 180000000,
      },
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
