import * as dbs from 'dbs'
import { EventEmitter } from 'events'
import registerSession from '../../../../../app/web/src/auth/session'
import { sessionStore } from '../../auth'

class Store extends EventEmitter {
  store: typeof sessionStore

  async set(sid: string, data: any, callback?: any) {
    await this.store.set(sid, data)
    callback()
  }

  async get(sid: string, callback?: any) {
    const data = await this.store.get(sid)
    if (callback) {
      callback(null, data)
    }
    return data
  }

  async destroy(sid: string, callback: () => void) {
    delete this.store[sid]
    await this.store.destroy(sid)
    if (callback) callback()
  }

  constructor() {
    super()
    this.store = registerSession({ db: dbs.db, dbs })
  }
}

export default Store
