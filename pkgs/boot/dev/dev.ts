import { exists, removeAsync } from 'fs-jetpack'
import pad from 'lodash.pad'
import padEnd from 'lodash.padend'
import { join } from 'path'
import { error, Forker, logUpdate, prettyError } from 'server-utility'
import { buildClient } from './build-client'
import { buildDb } from './build-db'
import { buildDbs } from './build-dbs'
import { buildWatch } from './build-watch'
import { parseConfig, ParsedConfig } from './config-parse'
const cwd = process.cwd()
const formatTs = (ts: number) => {
  return pad(`${((new Date().getTime() - ts) / 1000).toFixed(2)}s`, 7)
}
prettyError()
;(async () => {
  const ts = new Date().getTime()
  const ival = setInterval(() => {
    logUpdate(`[${formatTs(ts)}] ${padEnd('Booting Dev', 30)} `)
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
      await buildDb({ name: k, url: v.url, cwd })
    }
    await buildDbs(cwd, config)
  }

  const rebuildClient = async (config: ParsedConfig) => {
    for (let [k, v] of Object.entries(config.client)) {
      await buildClient({ cwd, name: k, config: v })
    }
  }

  // build config
  await buildWatch({
    input: join(cwd, 'config.ts'),
    output: join(cwd, '.output', 'config.js'),
    buildOptions: { minify: true },
    onReady: async (path) => {
      delete require.cache[path]
      const config = parseConfig(require(path).default, 'dev')
      await rebuildDB(config)

      // build app/*
      await rebuildClient(config)

      // build server/web
      await buildWatch({
        input: join(cwd, 'pkgs', 'server', 'web', 'src', 'index.ts'),
        output: join(cwd, '.output', 'pkgs', 'server.web.js'),
        buildOptions: {
          minify: true,
          sourcemap: 'linked',
        },
      })

      // build boot
      await buildWatch({
        input: join(cwd, 'pkgs', 'boot', 'src', 'index.ts'),
        output: join(cwd, '.output', 'server.js'),
        buildOptions: {
          minify: true,
          sourcemap: true,
          external: ['chokidar'],
        },
        onReady: () => {
          clearInterval(ival)
          logUpdate.done()
          Forker.run(join(cwd, '.output', 'server.js'), {
            arg: ['--mode', 'dev', ...process.argv.slice(4)],
          })
        },
      })
    },
  })
})()
