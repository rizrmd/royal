import { ParsedConfig } from 'boot/dev/config-parse'
import { createApp } from 'h3'
import { createServer } from 'http'
import { createClient } from './client/create-client'

export const web = {
  app: undefined as undefined | ReturnType<typeof createApp>,
  server: undefined as undefined | ReturnType<typeof createServer>,
}

export const startServer = async (
  config: ParsedConfig,
  mode: 'dev' | 'prod'
) => {
  const url = new URL(config.server.url)
  const app = createApp()
  let idx = 1
  for (let [name, client] of Object.entries(config.client)) {
    await createClient(
      app,
      name,
      client,
      config,
      mode,
      parseInt(url.port || '3200') + idx
    )
  }

  web.app = app
  web.server = createServer(web.app)
  web.server.listen(url.port || 3200)

}
