import { session } from 'platform'

const sessions: any = {}
export default session(({ db }) => ({
  destroy: async (sid) => {
    delete sessions[sid]

    // await db.sessions.delete({
    //   where: {
    //     sid,
    //   },
    // })
  },
  expires: () => {
    const date = new Date()
    date.setDate(date.getDate() + 3) // session expires in 3 days of inactivity
    return date
  },
  set: async (sid, data) => {
    sessions[sid] = data
    // await db.sessions.upsert({
    //   create: {
    //     sid,
    //     sess: data,
    //     expired,
    //   },
    //   update: {
    //     sid,
    //     sess: data,
    //     expired,
    //   },
    //   where: {
    //     sid,
    //   },
    // })
  },
  get: async (sid) => {
    return sessions[sid]

    // const res = await db.sessions.findFirst({
    //   where: {
    //     sid,
    //   },
    // })
    // if (res) {
    //   return res.sess
    // }
    return null
  },
}))
