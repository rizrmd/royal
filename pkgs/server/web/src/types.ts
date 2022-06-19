import { createApp } from 'h3'
import { IPrimaryWorker } from '.'

export type AppServer = {
  ext: Record<string, any>
  init?: (root: IPrimaryWorker) => Promise<void>
  workerStarted?: (app: ReturnType<typeof createApp>) => Promise<void>
  api?: Promise<{ default: Record<string, API> }>
  requireNpm?: string[]
}
import type { IncomingMessage, ServerResponse } from 'http'
import type { dbs } from 'server-db'

export type API = [string, (args: {
  req: IncomingMessage & { body: any }
  reply: ServerResponse & { send: (body: any) => void }
  ext: any
  mode: 'dev' | 'prod' | 'pkg'
  baseurl: string
  db: typeof dbs['db']
  session: any
}) => void | Promise<void>]
