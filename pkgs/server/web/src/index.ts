import type { ParsedConfig } from 'boot/dev/config-parse'
import dbs from 'dbs'
import { createApp } from 'h3'
import { createServer } from 'http'
import { log, prettyError } from 'server-utility'

const web = {
  app: null as null | ReturnType<typeof createApp>,
  server: null as null | ReturnType<typeof createServer>,
}

const printError = prettyError()

export default {
  start: async (arg: {
    dbs: typeof dbs
    config: ParsedConfig
    onStarted: () => void
  }) => {
    try {
      const { dbs, config } = arg
      const url = new URL(config.url)

      const app = createApp()
      app.use('/', () => 'Hello world!')

      web.app = app
      web.server = createServer(web.app)
      web.server.listen(url.port || 3200)

      if (arg.onStarted) arg.onStarted()

      log(`Server started at: ${config.url}`)
    } catch (e:any) {
      printError(e)
    }
  },
  stop: async () => {
    if (web.server) {
      web.server.close()
      web.server.unref()
    }
  },
}
