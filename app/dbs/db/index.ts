import * as pc from './node_modules/.prisma/client'
export type db_type = pc.PrismaClient
export const db = new pc.PrismaClient() as unknown as pc.PrismaClient

if (process.send) {
  db.$connect().then(() => {
    if (process.send) {
      process.send({event: 'ready'})
    }
    process.on('uncaughtException', (e) => { process.exit(1) })
    process.on('unhandledRejection', (e) => { process.exit(1) })
    process.on('message', async (data: any) => {
      if (process.send) {
        if (data.id) {
          try {
            process.send({
              id: data.id,
              value: await (db as any)[data.table][data.action](...data.params),
            })
          } catch (e) {
            process.exit(1)
          }
        }
      }
    })
  })
}

