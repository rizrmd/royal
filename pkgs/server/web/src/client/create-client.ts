import { BaseClient, ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'
import { setupDevProxy } from './dev-proxy'
import { setupProdStatic } from './prod-static'

export const createClient = async (
  app: ReturnType<typeof createApp>,
  name: string,
  client: BaseClient,
  config: ParsedConfig,
  mode: 'dev' | 'prod' | 'pkg',
  port: number
) => {
  const url = client.url.replace(`[server.url]`, config.server.url)

  if (url.startsWith(config.server.url)) {
    if (mode === 'dev') {
      setupDevProxy(app, config, url, port, name)
    } else {
      setupProdStatic(app, config, url, name, mode)
    }
  }
  // clients[name] = client
}
