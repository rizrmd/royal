export class Cookie {
  path: string
  httpOnly: boolean
  secure: boolean
  expires: Date | undefined
  sameSite: boolean | 'lax' | 'strict' | 'none' | undefined
  domain: string

  constructor(cookieOpts: any) {
    this.path = cookieOpts.path || '/'
    this.httpOnly =
      cookieOpts.httpOnly !== undefined ? cookieOpts.httpOnly : true
    this.secure = cookieOpts.secure
    this.expires = getExpires(cookieOpts)
    this.sameSite = cookieOpts.sameSite || null
    this.domain = cookieOpts.domain || null
  }

  options(secureConnection: boolean) {
    let secure = this.secure
    let sameSite = this.sameSite
    if (secure || typeof secure === 'undefined') {
      if (secureConnection === true) {
        secure = true
      } else {
        sameSite = 'lax'
        secure = false
      }
    } else {
      secure = this.secure
    }
    return {
      path: this.path,
      httpOnly: this.httpOnly,
      secure: secure,
      expires: this.expires,
      sameSite,
      domain: this.domain,
    }
  }
}

function getExpires(cookieOpts) {
  let expires: Date | undefined = undefined
  if (cookieOpts.expires) {
    expires = cookieOpts.expires
  }
  return expires
}
