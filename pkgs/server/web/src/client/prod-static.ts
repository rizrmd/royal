import { ParsedConfig } from 'boot/dev/config-parse'
import type { createApp } from 'h3'

export const setupProdStatic = async (
  app: ReturnType<typeof createApp>,
  config: ParsedConfig,
  url: string,
  name: string
) => {}
