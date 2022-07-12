import { createApp } from 'h3'
import type { IncomingMessage, ServerResponse } from 'http'
import type { dbs } from 'server-db'
import { IClusterParent } from '.'

// @ts-ignore
import type APIQuery from '../../../../app/server/src/query'

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
  query?: Promise<{ default: typeof APIQuery }>
  requireNpm?: string[]
}
export const g = global as typeof global & {
  dbs: dbs
  db: dbs['db']
}

export type APIProps = {
  body: any
  req: IncomingMessage
  reply: ServerResponse & { send: (body: any) => void }
  ext: any
  mode: 'dev' | 'prod' | 'pkg'
  baseurl: string
  session: any
}

export type API = [string, (args: APIProps) => void | Promise<void>]
