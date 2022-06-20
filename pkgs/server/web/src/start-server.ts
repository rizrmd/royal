import { ParsedConfig } from 'boot/dev/config-parse'
import { createApp, createRouter } from 'h3'
import { createServer } from 'http'
import { getAppServer } from './app-server'
import { createClient } from './client/create-client'
import { serveDb } from './client/serve-db'
import { serveDbPkg } from './client/serve-db-pkg'

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

  // serve db
  if (mode !== 'pkg') {
    serveDb({ app, config, mode })
  } else {
    await serveDbPkg({ app, config, mode })
  }

  // serve static file
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

  const gapp = await getAppServer()
  if (gapp.workerStarted) {
    await gapp.workerStarted(app)
  }

  if (gapp['api']) {
    const api = (await gapp['api']).default
    if (api) {
    }
  }

  web.app = app
  web.server = createServer(web.app)
  if (mode === 'pkg') {
    console.log(`Server started at http://localhost:${url.port}`)
  }

  web.server.listen(url.port || 3200)
}
