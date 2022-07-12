import { createApp } from 'h3'
import { IClusterParent } from '.'

export type AppServer = {
  ext: Record<string, any>
  events: {
    root?: {
      init: (root: IClusterParent) => Promise<void>
    }
    worker?: {
      init: (app: ReturnType<typeof createApp>) => Promise<void>
    }
  }
  api?: Promise<{ default: Record<string, API> }>
  requireNpm?: string[]
}
import type { IncomingMessage, ServerResponse } from 'http'
import type { dbs } from 'server-db'
export const g = global as typeof global & {
  dbs: dbs
  db: dbs['db']
}

export type API = [
  string,
  (args: {
    req: IncomingMessage & { body: any }
    reply: ServerResponse & { send: (body: any) => void }
    ext: any
    mode: 'dev' | 'prod' | 'pkg'
    baseurl: string
    db: dbs['db']
    dbs: dbs
    session: any
  }) => void | Promise<void>
]
