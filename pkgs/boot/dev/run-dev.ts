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

    let appServReqNpm = []
    const importAppServer = await import(join('../../../app/server/src/index'))
    if (importAppServer && importAppServer['default']) {
      const appServ = importAppServer['default']
      if (appServ) {
        appServReqNpm = appServ['requireNpm']

        if (appServReqNpm && appServReqNpm.length > 0) {
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
          })
        }
      }
    }

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
