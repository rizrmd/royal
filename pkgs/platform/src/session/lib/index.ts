import cookieSignature from 'cookie-signature'
import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { settings } from 'src'
import { Cookie } from './cookie'
import { Session } from './session'
import Store from './store'

type ISessionOptions = {
  secret: string
  store: Store
  cookieName: string
  cookie: Partial<Cookie>
}

function ensureDefaults(options: any): ISessionOptions {
  options.store = options.store || new Store()
  options.cookieName = options.cookieName || 'royal-session-id'
  options.cookie = options.cookie || {}
  options.cookie.name = options.cookieName

  settings.sidkey = options.cookieName

  options.cookie.secure = option(options.cookie, 'secure', true)
  options.saveUninitialized = option(options, 'saveUninitialized', true)
  options.secret = Array.isArray(options.secret)
    ? options.secret
    : [options.secret]
  return options
}

export default fp(
  async (fastify, options: ISessionOptions, next: any) => {
    const error = checkOptions(options)
    if (error) {
      return next(error)
    }

    options = ensureDefaults(options)
    fastify.decorate('decryptSession', async (sessionId, request, callback) => {
      callback(await decryptSession(sessionId, options, request))
    })
    fastify.decorateRequest('sessionStore', { getter: () => options.store })
    fastify.decorateRequest('session', null)
    fastify.addHook('onRequest', onRequest(options))
    fastify.addHook('onSend', onSend(options))
    next()
  },
  {
    fastify: '>=2.0.0',
    name: 'fastify-session',
    dependencies: ['fastify-cookie'],
  }
)

function onRequest(options: ISessionOptions) {
  const cookieOpts = options.cookie
  return function handleSession(
    request: FastifyRequest,
    reply: FastifyRequest,
    done
  ) {
    request.handleSession = async () => {
      if (!request.session) {
        const url = request.raw.url
        if (url && url.indexOf(cookieOpts.path || '/') !== 0) {
          return
        }

        let sessionId = request.headers['x-sid'] as string
        if (!sessionId) sessionId = request.cookies[options.cookieName]
        const secret = options.secret[0]
        if (!sessionId) {
          cookieOpts.expires = request.sessionStore.expires()

          request.session = new Session({
            cookieOpts,
            secret,
          })
        } else {
          await decryptSession(sessionId, options, request)
        }
      }
    }
    done()
  }
}

function onSend(options: ISessionOptions) {
  return function saveSession(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: any,
    done: any
  ) {
    const session = request.session
    if (session) {
      session.expires = request.sessionStore.expires()
      session.cookie.expires = session.expires
      request.sessionStore.set(session.sessionId, session).then(() => {
        const cookie = session.cookie.options
          ? session.cookie.options(isConnectionSecure(request))
          : session.cookie
        reply.setCookie(options.cookieName, session.encryptedSessionId, cookie)
        done()
      })
    } else {
      done()
    }
  }
}

async function decryptSession(
  encryptedSessionId: string,
  options: ISessionOptions,
  request: FastifyRequest
) {
  const cookieOpts = options.cookie
  const secrets = options.secret
  const secretsLength = secrets.length
  const secret = secrets[0]

  let decryptedSessionId = false as any
  for (let i = 0; i < secretsLength; ++i) {
    decryptedSessionId = cookieSignature.unsign(encryptedSessionId, secrets[i])
    if (decryptedSessionId !== false) {
      break
    }
  }

  if (decryptedSessionId === false) {
    cookieOpts.expires = request.sessionStore.expires()
    request.session = new Session({ cookieOpts, secret })
  } else {
    const sessionId = decryptedSessionId.split('.').shift()
    let prevSession = await options.store.get(sessionId)

    if (!prevSession) {
      prevSession = {
        sessionId,
        encryptedSessionId,
        role: 'guest',
        expires: request.sessionStore.expires(),
      }
    }
    request.session = new Session({ cookieOpts, secret, prevSession })
  }
}

function option(options: any, key: string, def: any) {
  return options[key] === undefined ? def : options[key]
}

function checkOptions(options: any) {
  if (!options.secret) {
    return new Error('the secret option is required!')
  }
  if (typeof options.secret === 'string' && options.secret.length < 32) {
    return new Error('the secret must have length 32 or greater')
  }
  if (Array.isArray(options.secret) && options.secret.length === 0) {
    return new Error('at least one secret is required')
  }
}

function getRequestProto(request) {
  return request.headers['x-forwarded-proto'] || 'http'
}

function isConnectionSecure(request) {
  if (isConnectionEncrypted(request)) {
    return true
  }
  return getRequestProto(request) === 'https'
}

function isConnectionEncrypted(request) {
  const socket = request.raw.socket
  if (socket && socket.encrypted === true) {
    return true
  }
  return false
}
