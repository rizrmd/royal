import alias from 'esbuild-plugin-alias'
import { exists, readAsync, removeAsync, writeAsync } from 'fs-jetpack'
import pad from 'lodash.pad'
import padEnd from 'lodash.padend'
import { join } from 'path'
import { error, Forker, logUpdate } from 'server-utility'
import { buildClient } from './build-client'
import { buildDb } from './build-db'
import { buildDbs } from './build-dbs'
import { rebuildAppServer } from './build-server'
import { buildWatch } from './build-watch'
import { dev } from './client/util'
import { parseConfig, ParsedConfig } from './config-parse'

import config from '../../../config'
import get from 'lodash.get'

const cwd = process.cwd()
const formatTs = (ts: number) => {
  return pad(`${((new Date().getTime() - ts) / 1000).toFixed(2)}s`, 7)
}

export const runDev = (
  watch: boolean,
  opt?: { isPkg?: true; isDebug?: true }
) => {
  return new Promise<void>(async (resolve) => {
    let ts = new Date().getTime()
    const isDebug = get(opt, 'isDebug', false)
    const ival = setInterval(() => {
      if (!isDebug)
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

    let debug = setInterval(() => {
      if (isDebug) logUpdate(`[${formatTs(ts)}] ${padEnd(`Building DB`, 30)} `)
    }, 100)
    const cfg = parseConfig(config, opt && opt.isPkg ? 'prod' : 'dev')
    await rebuildDB(cfg)

    ts = new Date().getTime()
    if (isDebug) logUpdate.done()
    clearInterval(debug)

    // build app/ext
    debug = setInterval(() => {
      if (isDebug)
        logUpdate(`[${formatTs(ts)}] ${padEnd(`Building App Server`, 30)} `)
    }, 100)
    await rebuildAppServer({ cwd, config: cfg, watch })

    ts = new Date().getTime()
    if (isDebug) logUpdate.done()
    clearInterval(debug)

    // build app/*

    debug = setInterval(() => {
      if (isDebug)
        logUpdate(`[${formatTs(ts)}] ${padEnd(`Building App Client`, 30)} `)
    }, 100)
    await rebuildClient(cfg)

    let appServReqNpm = []

    const importAppServer = await import(join('../../../app/server/src/index'))
    if (importAppServer && importAppServer['default']) {
      const appServ = importAppServer['default']
      if (appServ) {
        appServReqNpm = appServ['requireNpm'] || []

        const appServePkgJsonPath = join(cwd, 'app', 'server', 'package.json')
        const appServePkgJson = JSON.parse(
          (await readAsync(appServePkgJsonPath)) || '{}'
        ) as any

        if (Object.keys(appServePkgJson).length === 0) {
          console.log(`Failed to read file: ${appServePkgJsonPath}`)
          return
        }
        const versions = {} as Record<string, string>

        for (let p of appServReqNpm) {
          if (appServePkgJson.dependencies[p]) {
            versions[p] = appServePkgJson.dependencies[p]
          } else if (appServePkgJson.devDependencies[p]) {
            versions[p] = appServePkgJson.devDependencies[p]
          }
        }

        await writeAsync(join(cwd, '.output', 'package.json'), {
          name: config.app.name,
          version: config.app.version || '1.0.0',
          dependencies: versions,
          pkg: {
            assets: 'client/web/**/*',
          },
        })
      }
    }

    ts = new Date().getTime()
    if (isDebug) logUpdate.done()
    clearInterval(debug)

    debug = setInterval(() => {
      if (isDebug)
        logUpdate(`[${formatTs(ts)}] ${padEnd(`Building Web Server`, 30)} `)
    }, 100)
    // build server/web
    await buildWatch({
      input: join(cwd, 'pkgs', 'server', 'web', 'src', 'index.ts'),
      output: join(cwd, '.output', 'pkgs', 'server.web.js'),
      watch,
      buildOptions: {
        minify: true,
        sourcemap: 'linked',
        external: appServReqNpm,
      },
    })

    ts = new Date().getTime()
    if (isDebug) logUpdate.done()
    clearInterval(debug)


    debug = setInterval(() => {
      if (isDebug)
        logUpdate(`[${formatTs(ts)}] ${padEnd(`Starting Server`, 30)} `)
    }, 100)
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

        ts = new Date().getTime()
        if (isDebug) logUpdate.done()
        clearInterval(debug)
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
