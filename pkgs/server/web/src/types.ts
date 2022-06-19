import { createApp } from 'h3'
import { IPrimaryWorker } from '.'

export type AppServer = {
  ext: Record<string, any>
  init?: (root: IPrimaryWorker) => Promise<void>
  workerStarted?: (app: ReturnType<typeof createApp>) => Promise<void>
  requireNpm?: string[]
}

export const createApi = () => {}
