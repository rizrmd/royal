import { FastifyReply, FastifyRequest } from 'fastify'

export const loadSession = async (req: FastifyRequest, res: FastifyReply) => {
  const r = req as any

  if (!r.session) {
    r.session = { user: { role: 'guest' } }
    await r.handleSession()
  }

  if (
    !!r.session &&
    (Object.keys(r.session).length === 0 ||
      !r.session.user ||
      (r.session.user && !r.session.user.role))
  ) {
    r.session.user = {
      role: 'guest',
    }
  }

  return r.session
}
