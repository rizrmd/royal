import type { BaseConfig } from './pkgs/boot/dev/config-parse'
import 'dotenv/config'

export default {
  app: {
    name: 'app',
  },
  prod: {
    server: {
      url: 'https://localhost:3200',
    },
    client: {
      web: {
        url: '[server.url]',
      },
    },
    dbs: {
      db: {
        url: process.env.PROD_DB,
      },
    },
  },
  dev: {
    server: {
      url: 'http://localhost:3200',
    },
    client: {
      web: {
        url: '[server.url]/coba',
      },
    },
    dbs: {
      db: {
        url: process.env.DEV_DB,
      },
    },
  },
} as BaseConfig
