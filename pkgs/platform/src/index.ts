export * from './auth'

import { jsonPlugin } from './json'

export { FastifyRequest, FastifyReply } from 'fastify'
export const settings = {
  localIP: [] as string[],
  mode: 'dev' as 'dev' | 'prod',
  sidkey: '' as string,
}
