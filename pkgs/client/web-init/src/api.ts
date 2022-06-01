import type ext from '../../../../app/ext/src'
import type { dirs } from '../../../boot/src/dirs'
import * as dbs from '../../../../app/dbs/index'
import type { Session } from '../../../platform/src/session/lib/session'
import type {
  FastifyReply,
  FastifyRequest,
  FastifyInstance,
} from '../../../platform/src/index'
export const api = (
  url: string,
  func: (args: {
    req: FastifyRequest
    reply: FastifyReply
    ext: typeof ext
    server: FastifyInstance
    dirs: typeof dirs
    mode: 'dev' | 'prod'
    baseurl: string
    db: typeof dbs['db']
    session: Session
  }) => void | Promise<void>
) => {
  return [url, func]
}
