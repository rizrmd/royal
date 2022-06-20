import { BaseClient } from 'boot/dev/config-parse'
import { createApp } from 'h3'


export type IServeApiArgs = {
  app: ReturnType<typeof createApp>
  name: string
  client: BaseClient
  mode: 'dev' | 'prod' | 'pkg'
}

let cachedApiArgs = {} as IServeApiArgs
export const serveApi = (arg?: Partial<IServeApiArgs>) => {
  if (arg) {
    for (let [k, value] of Object.entries(arg)) {
      ; (cachedApiArgs as any)[k] = value
    }
  }
  let { app, name, client, mode } = cachedApiArgs

}
