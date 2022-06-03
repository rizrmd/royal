import { dirname, join } from 'path'

export type BaseClient = { url: string }
export type BaseConfig = {
  app: {
    name: string
  }
  prod: {
    server: {
      url: string
      worker: number
    }
    client: Record<string, BaseClient>
    dbs: Record<string, { url: string }>
  }
  dev: {
    server: {
      url: string
      worker: number
    }
    useProdDB?: boolean
    client: Record<string, BaseClient>
    dbs: Record<string, { url: string }>
  }
}

export type ParsedConfig = BaseConfig['prod'] & { app: BaseConfig['app'] }
export const readConfig = async (
  mode: 'dev' | 'prod'
): Promise<ParsedConfig> => {
  const cwd = dirname(__filename)

  if (mode === 'dev') {
    delete require.cache[join(cwd, 'config.js')]
  }
  const config = require(join(cwd, 'config.js')).default
  return parseConfig(config, mode)
}

export const parseConfig = (
  config: any,
  mode: 'dev' | 'prod'
): ParsedConfig => {
  const result = {
    app: config.app,
  } as any

  for (let [k, v] of Object.entries(config[mode])) {
    ;(result as any)[k] = v
  }

  if (result.useProdDB) {
    delete result.useProdDB
    result.dbs = config.prod.dbs
  }

  return result
}
