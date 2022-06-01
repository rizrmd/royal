import { retryFetch } from './retry-fetch'
import aesjs from 'aes-js'

export const getRandomBytes = (
  typeof self !== 'undefined' && (self.crypto || (self as any).msCrypto)
    ? function () {
        // Browsers
        var crypto = self.crypto || (self as any).msCrypto,
          QUOTA = 65536
        return function (n: any) {
          var a = new Uint8Array(n)
          for (var i = 0; i < n; i += QUOTA) {
            crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)))
          }
          return a
        }
      }
    : function () {
        // Node
        return require('crypto').randomBytes
      }
)()

const rfetch = retryFetch({
  retries: 3,
  retryDelay: 1000,
})

export const encrypt = async (msg: string) => {
  const w = window as any

  if (!w.auth) {
    const res = await rfetch(`${w.baseurl}/auth/data`)
    const auth = await res.json()
    w.auth = { user: auth }
  }

  const enc = new TextEncoder()
  const sess = enc.encode(w.auth.user.sessionId)
  const key = sess.slice(6, 6 + 16)

  const textBytes = aesjs.utils.utf8.toBytes(msg)
  const aesCtr1 = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5))

  return aesCtr1.encrypt(textBytes)
}
