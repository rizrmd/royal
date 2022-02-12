/// <reference types="node" />

import { FastifyPlugin } from 'fastify'
import { Session } from './session'

declare module 'fastify' {
  interface FastifyRequest {
    session: Session
    handleSession: () => Promise<void>
    sessionStore: FastifySessionPlugin.SessionStore
  }
}

declare namespace FastifySessionPlugin {
  interface SessionStore {
    set(sessionId: string, session: any & { role: string }): Promise<void>
    expires(): Date
    get(sessionId: string): Promise<any & { role: string }>
    destroy(sessionId: string): Promise<void>
  }

  interface Options {
    /**
     * The secret used to sign the cookie.
     *
     * Must be an array of strings, or a string with length 32 or greater. If an array, the first secret is used to
     * sign new cookies, and is the first one to be checked for incoming cookies.
     * Further secrets in the array are used to check incoming cookies, in the order specified.
     *
     * Note that the array may be manipulated by the rest of the application during its life cycle.
     * This can be done by storing the array in a separate variable that is later manipulated with mutating methods
     * like unshift(), pop(), splice(), etc.
     * This can be used to rotate the signing secret at regular intervals.
     * A secret should remain somewhere in the array as long as there are active sessions with cookies signed by it.
     * Secrets management is left up to the rest of the application.
     */
    secret: string | string[]
    /** The name of the session cookie. Defaults to `sessionId`. */
    cookieName?: string
    /** The options object used to generate the `Set-Cookie` header of the session cookie. */
    cookie?: CookieOptions
    /**
     * A session store.
     * Compatible to stores from express-session.
     * Defaults to a simple in memory store.
     * Note: The default store should not be used in a production environment because it will leak memory.
     */
    store?: FastifySessionPlugin.SessionStore
    /**
     * Save sessions to the store, even when they are new and not modified.
     * Defaults to true. Setting this to false can be useful to save storage space and to comply with the EU cookie law.
     */
    saveUninitialized?: boolean
  }

  interface CookieOptions {
    /**  The `Path` attribute. Defaults to `/` (the root path).  */
    path?: string
    /**  The `boolean` value of the `HttpOnly` attribute. Defaults to true. */
    httpOnly?: boolean
    /**  The `boolean` value of the `Secure` attribute. Set this option to false when communicating over an unencrypted (HTTP) connection. Value can be set to `auto`; in this case the `Secure` attribute will be set to false for HTTP request, in case of HTTPS it will be set to true.  Defaults to true. */
    secure?: boolean | string
    /**  The expiration `date` used for the `Expires` attribute. If both `expires` and `maxAge` are set, then `expires` is used. */
    expires?: Date | number
    /** The `boolean` or `string` of the `SameSite` attribute.  */
    sameSite?: string | boolean
    /**  The `Domain` attribute. */
    domain?: string
  }
}

declare const FastifySessionPlugin: FastifyPlugin<FastifySessionPlugin.Options>

export default FastifySessionPlugin
