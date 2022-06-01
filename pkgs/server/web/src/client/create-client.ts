import { BaseClient, ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'
import { setupDevProxy } from './dev-proxy'
const clients = {} as Record<string, BaseClient>

export const createClient = async (
  app: ReturnType<typeof createApp>,
  name: string,
  client: BaseClient,
  config: ParsedConfig,
  mode: 'dev' | 'prod',
  port: number
) => {
  const url = client.url.replace(`[server.url]`, config.server.url)

  if (url.startsWith(config.server.url)) {
    if (mode === 'dev') {
      setupDevProxy(app, config, url, port)
    }
  }

  // clients[name] = client
}
