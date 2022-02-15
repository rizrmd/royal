import { FastifyInstance } from 'fastify'
import { routeAuth } from './route-auth'
import { routeData } from './route-data'
import { routeProd } from './route-prod'

export const router = async (server: FastifyInstance, mode: 'dev' | 'prod') => {
  server.all('/__data*', async (req, reply) => {
    routeData(req, reply)
  })
  server.all('/auth*', routeAuth)
  if (mode === 'prod') {
    await routeProd(server)
  }
}
