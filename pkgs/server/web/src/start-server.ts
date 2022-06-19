import { ParsedConfig } from 'boot/dev/config-parse'
import { createApp, createRouter } from 'h3'
import { createServer } from 'http'
import { createClient } from './client/create-client'

import importedApp from '../../../../app/server/src/index'

export const web = {
  app: undefined as undefined | ReturnType<typeof createApp>,
  server: undefined as undefined | ReturnType<typeof createServer>,
  clients: {} as Record<string, {}>,
  ext: undefined as undefined | (Record<string, any> & { init?: () => void }),
}

export const startServer = async (
  config: ParsedConfig,
  mode: 'dev' | 'prod' | 'pkg'
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

  if (importedApp) {
    if (importedApp['workerStarted']) {
      const start = importedApp['workerStarted']
      await start(app)
    }

    if (importedApp['api']) {
      const api = (await importedApp['api']).default
      if (api) {
        
      }
    }
  }

  web.app = app
  web.server = createServer(web.app)
  if (mode === 'pkg') {
    console.log(`Server started at http://localhost:${url.port}`)
  }

  web.server.listen(url.port || 3200)
}
