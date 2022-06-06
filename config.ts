import type { BaseConfig } from './pkgs/boot/dev/config-parse'
import 'dotenv/config'

export default {
  app: {
    name: 'app',
  },
  prod: {
    server: {
      url: 'https://localhost:3200',
      worker: Number.MAX_VALUE,
    },
    client: {
      web: {
        url: '[server.url]',
      },
    },
    dbs: {
      db: {
        url: "postgresql://postgres:goperasidatabase123@db.goperasi.id:5432/godirect?schema=public&pool_timeout=0",
      },
    },
  },
  dev: {
    server: {
      url: 'http://localhost:3200',
      worker: 1,
    },
    client: {
      web: {
        url: '[server.url]/',
      },
    },
    dbs: {
      db: {
        url: "postgresql://postgres:goperasidatabase123@db.goperasi.id:5432/godirect?schema=public&pool_timeout=0",
      },
    },
  },
} as BaseConfig
