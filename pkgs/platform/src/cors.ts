import { FastifyReply, FastifyRequest } from 'fastify'
import { settings } from 'src'
import baseurl from '../../../app/web/src/baseurl'
export const allowCors = (req: FastifyRequest, reply: FastifyReply) => {
  const base = new URL(
    baseurl({ mode: settings.mode, ips: [...settings.localIP] })
  )

  if (req.headers['origin']) {
    const origin = new URL(req.headers['origin'])

    if (
      origin.hostname === 'localhost' ||
      settings.localIP.indexOf(origin.hostname) ||
      origin.hostname === base.hostname
    ) {
      reply.header(
        'Access-Control-Allow-Origin',
        `${origin.protocol}//${origin.hostname}:${origin.port}`
      )
      reply.header('Access-Control-Allow-Methods', `*`)
      reply.header('Access-Control-Allow-Headers', `Content-Type, x-sid, *`)
      reply.header('Access-Control-Allow-Credentials', 'true')
      return true
    }
  }
  return false
}
