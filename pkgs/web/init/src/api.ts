import type ext from '../../../../app/ext/src'
import * as dbs from '../../../../app/dbs/index'
import type { Session } from '../../../platform/src/session/lib/session'
import type { FastifyReply, FastifyRequest } from '../../../platform/src/index'
export const api = (
  url: string,
  func: (args: {
    req: FastifyRequest
    reply: FastifyReply
    ext: typeof ext
    db: typeof dbs['db']
    session: Session
  }) => void | Promise<void>
) => {
  return [url, func]
}
