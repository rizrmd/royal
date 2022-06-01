import arg from 'arg'
import { exists } from 'fs-jetpack'
import padEnd from 'lodash.padend'
import { dirname, join } from 'path'
import type db from 'server-db'
import { Forker, logUpdate, waitUntil } from 'server-utility'
import type web from 'server-web'
import { clearInterval } from 'timers'
import { ParsedConfig, readConfig } from '../dev/config-parse'
import { npm } from './npm-run'

const varg = arg({ '--mode': String })
const mode = (Forker.mode = varg['--mode'] === 'dev' ? 'dev' : 'prod')
const formatTs = (ts: number) => {
  return `${((new Date().getTime() - ts) / 1000).toFixed(2)}s`
}
const cwd = dirname(__filename)

const app = {
  server: {
    path: join(cwd, 'pkgs', 'server.web.js'),
    module: null as null | typeof web,
    timer: { ts: 0, ival: null as any },
  },
  app: {} as Record<string, { name: string; module: any }>,
  db: {
    path: join(cwd, 'pkgs', 'server.db.js'),
    module: null as null | typeof db,
    fork: null as any,
    timer: { ts: 0, ival: null as any },
  },
}

const startDbs = async (config: ParsedConfig) => {
  if (app.db.timer.ival !== null) {
    await waitUntil(() => app.db.timer.ival === null)
    return
  }

  app.db.timer.ts = new Date().getTime()
  if (mode === 'dev') {
    app.db.timer.ival = setInterval(() => {
      logUpdate(
        `[${formatTs(app.db.timer.ts)}] ${padEnd('Initializing DB', 30)}`
      )
    }, 100)
  }

  if (app.db.module) {
    await app.db.module.stop()
  }

  delete require.cache[app.db.path]
  app.db.module = require(app.db.path).default
  if (app.db.module) app.db.fork = await app.db.module.start(config)

  clearInterval(app.db.timer.ival)
  app.db.timer.ival = null
  if (mode === 'prod') {
    console.log(
      `[${formatTs(app.db.timer.ts)}] ${padEnd('Initializing DB', 30)}`
    )
  }
}

const startServer = async (config: ParsedConfig) => {
  if (app.server.timer.ival !== null) {
    await waitUntil(() => app.server.timer.ival === null)
    return
  }
  app.server.timer.ts = new Date().getTime()

  if (mode === 'dev') {
    console.log('[0.00s] Starting API Server')
    app.server.timer.ival = setInterval(() => {
      logUpdate(
        `[${formatTs(app.server.timer.ts)}] ${padEnd('Starting API Server', 30)}`
      )
    }, 100)
  }

  if (app.server.module) {
    await app.server.module.stop()
  }

  delete require.cache[app.server.path]
  app.server.module = require(app.server.path).default
  if (app.server.module) {
    await app.server.module.start({
      dbs: app.db.fork,
      config,
      onStarted: () => {
        clearInterval(app.server.timer.ival)
        app.server.timer.ival = null
        if (mode === 'prod') {
          console.log(
            `[${formatTs(app.server.timer.ts)}] ${padEnd(
              'Starting API Server',
              30
            )}`
          )
        }
      },
    })
  }
}

// start
;(async () => {
  const config = await readConfig(mode)

  if (mode === 'dev') {
    Forker.asChild({
      onKilled: async () => {
        if (app.server.module) await app.server.module.stop()
        if (app.db.module) await app.db.module.stop()
      },
    })

    const { watch } = require('chokidar')

    watch(app.server.path).on('change', async () => {
      await startServer(config)
    })
    watch(app.db.path).on('change', async () => {
      await startDbs(config)
      await startServer(config)
    })
    await startDbs(config)
    await startServer(config)
  } else {
    for (let key of Object.keys(config.dbs)) {
      if (!exists(join(cwd, 'pkgs', 'dbs', key, 'node_modules'))) {
        await npm(['install'], {
          cwd: join(cwd, 'pkgs', 'dbs', key),
          name: 'dbs/' + key,
        })
      }
    }
    await startDbs(config)
    await startServer(config)
  }
})()
