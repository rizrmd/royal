import { ParsedConfig } from 'boot/dev/config-parse'
import { createApp, createRouter } from 'h3'
import { createServer } from 'http'
import get from 'lodash.get'
import { getAppServer } from './app-server'
import { createClient } from './client/create-client'
import { serveDb } from './routes/serve-db'
import { serveDbPkg } from './routes/serve-db-pkg'

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
  const app = createApp()

  const gapp = await getAppServer()

  const onInitWorker = get(gapp, 'events.worker.init')

  if (onInitWorker) {
    await onInitWorker(app, config)
  }

  const url = new URL(config.server.url)

  if (gapp['api']) {
    const api = (await gapp['api']).default
    if (api) {
    }
  }

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

  web.app = app
  web.server = createServer(web.app)
  if (mode === 'pkg') {
    console.log(`Server started at http://localhost:${url.port}`)
  }

  web.server.listen(url.port || 3200)
}
