import type { ParsedConfig } from 'boot/dev/config-parse'
import dbs from 'dbs'
import { createApp } from 'h3'
import { createServer } from 'http'
import { log, prettyError } from 'server-utility'
import { createClient } from './client/create-client'

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
      const { config } = arg
      const url = new URL(config.server.url)

      const app = createApp()
      for (let [k, v] of Object.entries(config.client)) {
        if (v.url.startsWith(config.server.url)) {
          await createClient(app, k, v, config)
        }
      }

      web.app = app
      web.server = createServer(web.app)
      web.server.listen(url.port || 3200)

      if (arg.onStarted) arg.onStarted()

      log(`API Server started at: ${config.server.url}`)
    } catch (e: any) {
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
