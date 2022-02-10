import fp from 'fastify-plugin'
import serializeJavascript from 'serialize-javascript'

export const jsonPlugin = fp(function (server, _: any, done: () => void) {
  server.addContentTypeParser(
    'application/javascript',
    { parseAs: 'string' },
    function (_, body, done) {
      try {
        var newBody = {
          raw: body,
        }
        done(null, newBody)
      } catch (error: any) {
        error.statusCode = 400
        done(error, undefined)
      }
    }
  )
  server.addContentTypeParser(
    'application/vnd.api+json',
    { parseAs: 'string' },
    (_, body, done) => {
      try {
        done(null, body)
      } catch (err: any) {
        err.statusCode = 400
        done(err, undefined)
      }
    }
  )
  server.addContentTypeParser('text/plain', function (req, payload, done) {
    const data: any[] = []

    payload
      .on('data', function (chunk) {
        data.push(chunk)
      })
      .on('end', function () {
        done(null, Buffer.concat(data))
      })
  })

  server.addHook('onSend', (_req, reply, payload, done) => {
    const err = null

    if ((reply as any).isCMS) {
      if (typeof payload === 'object') {
        if (!!(payload as any)._readableState) {
          // this is a stream
          done(err, payload)
        } else {
          done(
            err,
            typeof payload === 'object' ? serializeJavascript(payload) : payload
          )
        }
        return
      }
    }
    done(err, payload)
  })
  // your plugin code
  done()
})
