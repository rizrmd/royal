import alias from 'esbuild-plugin-alias'
import { exists, removeAsync } from 'fs-jetpack'
import pad from 'lodash.pad'
import padEnd from 'lodash.padend'
import { join } from 'path'
import { error, Forker, logUpdate, silentUpdate } from 'server-utility'
import config from '../../../config'
import { buildClient } from './build-client'
import { buildDb } from './build-db'
import { buildDbs } from './build-dbs'
import { rebuildAppServer } from './build-server'
import { buildWatch } from './build-watch'
import { dev } from './client/util'
import { parseConfig, ParsedConfig } from './config-parse'
const cwd = process.cwd()
const formatTs = (ts: number) => {
  return pad(`${((new Date().getTime() - ts) / 1000).toFixed(2)}s`, 7)
}

export const runDev = (watch: boolean) => {
  return new Promise<void>(async (resolve) => {
    const ts = new Date().getTime()
    const ival = setInterval(() => {
      logUpdate(`[${formatTs(ts)}] ${padEnd(`Booting Royal`, 30)} `)
    }, 100)
    if (!exists(join(cwd, 'pkgs'))) {
      error(
        'Directory pkgs not found. Please run `node base` from root directory.'
      )
      return
    }

    await removeAsync(join(cwd, '.output', 'server.js'))

    const rebuildDB = async (config: ParsedConfig) => {
      for (let [k, v] of Object.entries(config.dbs)) {
        await buildDb({ name: k, url: v.url, cwd, watch })
      }
      if (Object.keys(config.dbs).length > 0) {
        await buildDbs(cwd, config, watch)
      }
    }

    const rebuildClient = async (config: ParsedConfig) => {
      for (let [k, v] of Object.entries(config.client)) {
        await buildClient({ cwd, name: k, config: v, watch })
      }
    }

    const cfg = parseConfig(config, 'dev')
    await rebuildDB(cfg)

    // build app/ext
    await rebuildAppServer({ cwd, config: cfg, watch })

    // build app/*
    await rebuildClient(cfg)

    // build server/web
    await buildWatch({
      input: join(cwd, 'pkgs', 'server', 'web', 'src', 'index.ts'),
      output: join(cwd, '.output', 'pkgs', 'server.web.js'),
      watch,
      buildOptions: {
        minify: true,
        sourcemap: 'linked',
      },
    })

    // build boot
    await buildWatch({
      input: join(cwd, 'pkgs', 'boot', 'src', 'index.ts'),
      output: join(cwd, '.output', 'server.js'),
      watch,
      buildOptions: {
        minify: true,
        sourcemap: true,
        external: ['chokidar'],
        plugins: [
          alias({
            pidtree: join(cwd, 'pkgs', 'boot', 'src', 'pidtree.js'),
          }),
        ],
      },
      onReady: async () => {
        clearInterval(ival)
        logUpdate.done()
        if (watch) {
          dev.boot = await Forker.run(join(cwd, '.output', 'server.js'), {
            arg: ['--mode', 'dev', ...process.argv.slice(4)],
          })
        }
        resolve()
      },
    })
  })
}
