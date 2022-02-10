import * as dbs from 'dbs'
import { FastifyReply, FastifyRequest } from 'fastify'
import login from '../../../../app/web/src/auth/login'
import logout from '../../../../app/web/src/auth/logout'

const formatSession = (req: FastifyRequest) => {
  const session = { ...req.session }
  delete session.cookie
  return session
}

export const routeAuth = async (req: FastifyRequest, reply: FastifyReply) => {
  const url = req.url

  await (req as any).handleSession()

  switch (url) {
    case '/auth/set-data':
      {
        const { key, value } = req.body as any
        if (key) {
          req.session[key] = value
        }
        reply.send(formatSession(req))
      }
      break
    case '/auth/data':
      {
        reply.send(formatSession(req))
      }
      break
    case '/auth/login':
      await login({
        sid: req.session.sessionId,
        db: dbs.db,
        dbs: dbs,
        req,
        reply,
      })
      reply.send(formatSession(req))
      break
    case '/auth/logout':
      await logout({
        sid: req.session.sessionId,
        db: dbs.db,
        dbs: dbs,
        req,
        reply,
      })
      reply.send(formatSession(req))
      break
  }
}
