import arg from 'arg'
import { exists } from 'fs-jetpack'
import padEnd from 'lodash.padend'
import logUpdate from 'log-update'
import { dirname, join } from 'path'
import type db from 'server-db'
import { Forker, waitUntil } from 'server-utility'
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

const server = {
  web: {
    path: join(cwd, 'pkgs', 'server.web.js'),
    module: null as null | typeof web,
    timer: { ts: 0, ival: null as any },
  },
  db: {
    path: join(cwd, 'pkgs', 'server.db.js'),
    module: null as null | typeof db,
    fork: null as any,
    timer: { ts: 0, ival: null as any },
  },
}

const startDbs = async (config: ParsedConfig) => {
  if (server.db.timer.ival !== null) {
    await waitUntil(() => server.db.timer.ival === null)
    return
  }

  server.db.timer.ts = new Date().getTime()
  if (mode === 'dev') {
    server.db.timer.ival = setInterval(() => {
      logUpdate(
        `[${formatTs(server.db.timer.ts)}] ${padEnd('Initializing DB', 30)}`
      )
    }, 100)
  }

  if (server.db.module) {
    await server.db.module.stop()
  }

  delete require.cache[server.db.path]
  server.db.module = require(server.db.path).default
  if (server.db.module) server.db.fork = await server.db.module.start(config)

  clearInterval(server.db.timer.ival)
  server.db.timer.ival = null
  if (mode === 'prod') {
    console.log(
      `[${formatTs(server.db.timer.ts)}] ${padEnd('Initializing DB', 30)}`
    )
  }
}

const startWeb = async (config: ParsedConfig) => {
  if (server.web.timer.ival !== null) {
    await waitUntil(() => server.web.timer.ival === null)
    return
  }
  server.web.timer.ts = new Date().getTime()

  if (mode === 'dev') {
    console.log('[0.00s] Starting Server')
    server.web.timer.ival = setInterval(() => {
      logUpdate(
        `[${formatTs(server.web.timer.ts)}] ${padEnd('Starting Server', 30)}`
      )
    }, 100)
  }

  if (server.web.module) {
    await server.web.module.stop()
  }

  delete require.cache[server.web.path]
  server.web.module = require(server.web.path).default
  if (server.web.module) {
    await server.web.module.start({
      dbs: server.db.fork,
      config,
      onStarted: () => {
        clearInterval(server.web.timer.ival)
        server.web.timer.ival = null
        if (mode === 'prod') {
          console.log(
            `[${formatTs(server.web.timer.ts)}] ${padEnd(
              'Starting Server',
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
        if (server.web.module) await server.web.module.stop()
        if (server.db.module) await server.db.module.stop()
      },
    })

    const { watch } = require('chokidar')

    watch(server.web.path).on('change', async () => {
      await startWeb(config)
    })
    watch(server.db.path).on('change', async () => {
      await startDbs(config)
      await startWeb(config)
    })
    await startDbs(config)
    await startWeb(config)
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
    await startWeb(config)
  }
})()
