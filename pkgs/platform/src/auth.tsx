import * as dbs from '../../../app/dbs'
import { FastifyReply, FastifyRequest } from 'fastify'

export const sessionStore = {
  set: async (sid: string, data: Record<string, any> & { role: string }) => {},
  expires: () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date
  },
  get: async (sid: string): Promise<Record<string, any> & { role: string }> => {
    return { role: 'guest' }
  },
  destroy: async (sid: string) => {},
}

export const dbAuth = (
  fc: (arg: {
    db: string
    table: string
    action: string
    params: string
  }) => Promise<boolean> | boolean
) => {
  return fc
}

export const login = (
  fc: (arg: {
    sid: string
    dbs: typeof dbs
    db: typeof dbs.db
    req: FastifyRequest & { session: any }
    reply: FastifyReply
  }) => Promise<void>
) => {
  return fc
}

export const logout = (
  fc: (arg: {
    db: typeof dbs.db
    dbs: typeof dbs
    sid: string
    req: FastifyRequest & { session: any }
    reply: FastifyReply
  }) => Promise<void>
) => {
  return fc
}

export const session = (
  fc: (arg: { db: typeof dbs.db; dbs: typeof dbs }) => typeof sessionStore
) => {
  const ses = fc({ db: dbs.db, dbs })
  sessionStore.set = ses.set
  sessionStore.get = ses.get
  sessionStore.expires = ses.expires
  sessionStore.destroy = ses.destroy
  return fc
}
