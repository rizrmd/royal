import arg from 'arg'
import { ChildProcess, fork } from 'child_process'
import type chokidar from 'chokidar'
import { exists } from 'fs-jetpack'
import pad from 'lodash.pad'
import padEnd from 'lodash.padend'
import throttle from 'lodash.throttle'
import { dirname, join } from 'path'
import { Forker, log, logUpdate, waitUntil } from 'server-utility'
import { clearInterval } from 'timers'
import { ParsedConfig, readConfig } from '../dev/config-parse'
import { startDevClient } from './dev-client'
import { npm } from './npm-run'
import { printProcessUsage } from './utils/process-usage'

const varg = arg({ '--mode': String })
let mode = (Forker.mode = varg['--mode'] === 'dev' ? 'dev' : 'prod') as
  | 'dev'
  | 'prod'
  | 'pkg'

if (
  !process.execPath.endsWith('node') &&
  !process.execPath.endsWith('node.exe')
) {
  mode = 'pkg'
}

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
}
export type IApp = typeof app

const startServer = async (
  config: ParsedConfig,
  mode: 'dev' | 'prod' | 'pkg'
) => {
  if (mode === 'pkg') {
    const { startServer } = await import('../../server/web/src/start-server')
    await startServer(config, mode)
    return
  }

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
        fork.on('exit', resolve)
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
        startServer(config, mode)
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
    `[${formatTs(app.server.timer.ts)}] 🌿 ${padEnd(
      `Back End started at`,
      24
    )} ➜ ${url}`
  )
  logUpdate.done()

  await printProcessUsage()
}

// start
;(async () => {
  const config = await readConfig(mode)

  if (mode === 'dev') {
    Forker.asChild({
      onKilled: async () => {
        log('\n\nRestarting Dev Process')
        if (app.server.fork) await app.server.kill()
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
      await startServer(config, mode)
    })

    await startServer(config, mode)

    await startDevClient(config, app, cwd)

    process.on('message', (data: any) => {
      if (typeof data === 'object') {
        if (data.action === 'reload.api' && data.name) {
          app.server.fork?.send(data)
        }
      }
    })
  } else if (mode === 'prod') {
    for (let key of Object.keys(config.dbs)) {
      if (!exists(join(cwd, 'pkgs', 'dbs', key, 'node_modules'))) {
        await npm(['install'], {
          cwd: join(cwd, 'pkgs', 'dbs', key),
          name: 'dbs/' + key,
        })
      }
    }

    if (exists(join(cwd, 'package.json'))) {
      await npm(['install'], {
        cwd: join(cwd),
        name: 'server ',
      })
    }

    await startServer(config, mode)
  } else {
    await startServer(config, mode)
  }
})()
