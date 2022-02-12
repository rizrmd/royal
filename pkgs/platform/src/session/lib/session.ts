import { Cookie } from './cookie'
import uid from 'uid-safe'
import cookieSignature from 'cookie-signature'

const secretKey = Symbol('secretKey')
const sign = Symbol('sign')
const addDataToSession = Symbol('addDataToSession')
const generateId = Symbol('generateId')

type INewSession = {
  cookieOpts: any
  secret: string
  prevSession?: any
}

export class Session {
  expires: null | Date
  role: string
  cookie: Cookie
  sessionId: string = ''
  encryptedSessionId: string = ''

  constructor({ cookieOpts, secret, prevSession }: INewSession) {
    this.expires = null
    this.cookie = new Cookie(cookieOpts)
    this.role = 'guest'

    this[generateId] = () => uid.sync(24)
    this[secretKey] = secret
    this[addDataToSession](prevSession)

    if (!this.sessionId) {
      this.regenerate()
    }
  }

  regenerate() {
    this.sessionId = this[generateId]()
    this.encryptedSessionId = this[sign]()
  }

  [addDataToSession](prevSession) {
    for (const key in prevSession) {
      this[key] = prevSession[key]
    }
  }

  [sign]() {
    return cookieSignature.sign(this.sessionId, this[secretKey])
  }
}
