import * as dbs from '../../../../../app/dbs'
import { EventEmitter } from 'events'
import registerSession from '../../../../../app/web/src/auth/session'
import { sessionStore } from '../../auth'

class Store extends EventEmitter {
  store: typeof sessionStore

  async set(sid: string, data: any) {
    await this.store.set(sid, data)
  }

  async get(sid: string) {
    const data = await this.store.get(sid)
    return data
  }

  expires() {
    return sessionStore.expires()
  }

  async destroy(sid: string) {
    delete this.store[sid]
    await this.store.destroy(sid)
  }

  constructor() {
    super()
    this.store = registerSession({ db: dbs.db, dbs })
  }
}

export default Store
