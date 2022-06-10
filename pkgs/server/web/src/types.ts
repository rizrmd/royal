import { createApp } from 'h3'

export type AppServer = {
  ext: Record<string, any>
  init: (app: ReturnType<typeof createApp>) => Promise<void>
}
