import type { BaseConfig } from './pkgs/boot/dev/config-parse'
import 'dotenv/config'

export default {
  app: {
    name: 'app',
  },
  prod: {
    url: 'https://localhost:3200',
    dbs: {
      db: {
        url: process.env.PROD_DB,
      },
    },
  },
  dev: {
    url: 'http://localhost:3200',
    useProdDB: true,
    dbs: {
      db: {
        url: process.env.DEV_DB,
      },
    },
  },
} as BaseConfig
