import type { IncomingMessage, ServerResponse } from 'http'
import type { dbs } from 'server-db'

export const declareAPI = (
  url: string,
  func: (args: {
    req: IncomingMessage & { body: any }
    reply: ServerResponse & { send: (body: any) => void }
    ext: any
    mode: 'dev' | 'prod' | 'pkg'
    baseurl: string
    db: typeof dbs['db']
    session: any
  }) => void | Promise<void>
) => {
  return [url, func]
}
