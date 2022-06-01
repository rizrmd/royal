import { BaseClient, ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'

const clients = {} as Record<string, BaseClient>

export const createClient = async (
  app: ReturnType<typeof createApp>,
  name: string,
  client: BaseClient,
  config: ParsedConfig
) => {
  const url = client.url.replace(`[server.url]`, config.server.url)
  clients[name] = client
}
