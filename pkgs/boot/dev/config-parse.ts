import { dirname, join } from 'path'
import config from '../../../config'

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
  mode: 'dev' | 'prod' | 'pkg'
): Promise<ParsedConfig> => {
  return parseConfig(config, mode)
}

export const parseConfig = (
  config: any,
  mode: 'dev' | 'prod' | 'pkg'
): ParsedConfig => {
  const result = {
    app: config.app,
  } as any

  let configMode = mode
  if (mode === 'pkg') {
    configMode = 'prod'
  }
  for (let [k, v] of Object.entries(config[configMode])) {
    ;(result as any)[k] = v
  }

  if (result.useProdDB) {
    delete result.useProdDB
    result.dbs = config.prod.dbs
  }

  return result
}
