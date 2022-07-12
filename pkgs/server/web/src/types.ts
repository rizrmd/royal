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
  query?: Promise<{ default: Record<string, APIQuery> }>
  requireNpm?: string[]
}
import type { IncomingMessage, ServerResponse } from 'http'
import type { dbs } from 'server-db'
export const g = global as typeof global & {
  dbs: dbs
  db: dbs['db']
}

type IAPIArgs = {
  body: any
  req: IncomingMessage
  reply: ServerResponse & { send: (body: any) => void }
  ext: any
  mode: 'dev' | 'prod' | 'pkg'
  baseurl: string
  session: any
}

export type APIQuery = (
  args: IAPIArgs
) => Promise<Record<string, any> | Record<string, any>[]>

export type API = [string, (args: IAPIArgs) => void | Promise<void>]
