import arg from 'arg'
import { ChildProcess, fork } from 'child_process'
import { exists } from 'fs-jetpack'
import pad from 'lodash.pad'
import padEnd from 'lodash.padend'
import { dirname, join } from 'path'
import type db from 'server-db'
import { Forker, log, logUpdate, waitUntil } from 'server-utility'
import { clearInterval } from 'timers'
import { ParsedConfig, readConfig } from '../dev/config-parse'
import { startDevClient } from './dev-client'
import { npm } from './npm-run'
import type chokidar from 'chokidar'
import throttle from 'lodash.throttle'

const varg = arg({ '--mode': String })
const mode = (Forker.mode = varg['--mode'] === 'dev' ? 'dev' : 'prod')
export const formatTs = (ts: number) => {
  return pad(`${((new Date().getTime() - ts) / 1000).toFixed(2)}s`, 7)
}
const cwd = dirname(__filename)

const app = {
  server: {
    path: join(cwd, 'pkgs', 'server.web.js'),
    fork: null as null | ChildProcess,
    kill: async () => {},
    timer: { ts: 0, ival: null as any },
  },
  client: {} as Record<string, ChildProcess>,
  db: {
    path: join(cwd, 'pkgs', 'server.db.js'),
    module: null as null | typeof db,
    fork: null as any,
    timer: { ts: 0, ival: null as any },
  },
}
export type IApp = typeof app

const startDbs = async (config: ParsedConfig) => {
  if (app.db.timer.ival !== null) {
    await waitUntil(() => app.db.timer.ival === null)
    return
  }

  app.db.timer.ts = new Date().getTime()
  if (mode === 'dev') {
    app.db.timer.ival = setInterval(() => {
      logUpdate(`[${formatTs(app.db.timer.ts)}] ${padEnd('Connecting DB', 30)}`)
    }, 100)
  }

  if (app.db.module) {
    await app.db.module.stop()
  }

  delete require.cache[app.db.path]
  app.db.module = require(app.db.path).default
  if (app.db.module) app.db.fork = await app.db.module.start(config)

  logUpdate.done()
  clearInterval(app.db.timer.ival)
  app.db.timer.ival = null
  if (mode === 'prod') {
    console.log(`[${formatTs(app.db.timer.ts)}] ${padEnd('Connecting DB', 30)}`)
  }
}

const startServer = async (config: ParsedConfig) => {
  if (app.server.timer.ival !== null) {
    await waitUntil(() => app.server.timer.ival === null)
    return
  }
  app.server.timer.ts = new Date().getTime()

  if (mode === 'dev') {
    app.server.timer.ival = setInterval(() => {
      logUpdate(
        `[${formatTs(app.server.timer.ts)}] ${padEnd('Starting Back End', 30)}`
      )
    }, 100)
  }

  if (app.server.fork) {
    await app.server.kill()
  }

  app.server.fork = fork(app.server.path)
  app.server.kill = () => {
    return new Promise((resolve) => {
      const fork = app.server.fork
      if (fork) {
        fork.removeAllListeners()
        fork.on('close', resolve)
        fork.send({ action: 'kill' })
      }
    })
  }
  app.server.fork.once('spawn', () => {
    app.server.fork?.send({
      action: 'init',
      config,
      mode,
    })
  })

  const restartServer = throttle(
    () => {
      if (app.server.fork) {
        app.server.fork = null
        console.log('Back End Killed. Restarting...')
        startServer(config)
      }
    },
    1000,
    { trailing: false }
  )
  app.server.fork.once('exit', restartServer)
  app.server.fork.once('close', restartServer)
  app.server.fork.once('disconnect', restartServer)
  app.server.fork.once('error', restartServer)
  app.server.fork.once('error', restartServer)
  app.server.fork.stdout?.pipe(process.stdout)
  app.server.fork.stderr?.pipe(process.stderr)

  const { url } = await new Promise<{ url: string }>((started) => {
    app.server.fork?.once(
      'message',
      (data: { event: 'started'; url: string }) => {
        if (data.event === 'started') {
          started({ url: data.url })
        }
      }
    )
  })

  clearInterval(app.server.timer.ival)
  app.server.timer.ival = null
  logUpdate(
    `[${formatTs(app.server.timer.ts)}] 🍊 ${padEnd(
      `Back End started at`,
      24
    )} ➜ ${url}`
  )
  logUpdate.done()
}

// start
;(async () => {
  const config = await readConfig(mode)

  if (mode === 'dev') {
    Forker.asChild({
      onKilled: async () => {
        log('\n\nRestarting Dev Process')
        if (app.server.fork) await app.server.kill()
        if (app.db.module) await app.db.module.stop()
        await Promise.all(
          Object.values(app.client).map((cp) => {
            return new Promise((killed) => {
              if (cp) {
                cp.on('close', killed)
                cp.on('disconnect', killed)
                cp.on('exit', killed)
                cp.kill()
              }
            })
          })
        )
      },
    })

    const { watch } = require('chokidar') as typeof chokidar
    watch(app.server.path).on('change', async () => {
      await startServer(config)
    })
    watch(app.db.path).on('change', async () => {
      await startDbs(config)
      await startServer(config)
    })

    await startDbs(config)
    await startDevClient(config, app, cwd)
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
