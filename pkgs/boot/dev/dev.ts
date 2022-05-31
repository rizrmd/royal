import { exists, removeAsync } from 'fs-jetpack'
import throttle from 'lodash.throttle'
import { join } from 'path'
import { error, Forker, prettyError } from 'server-utility'
import { buildDb } from './build-db'
import { buildWatch } from './build-watch'
import { parseConfig, ParsedConfig } from './config-parse'
const cwd = process.cwd()

prettyError()
;(async () => {
  if (!exists(join(cwd, 'pkgs'))) {
    error(
      'Directory pkgs not found. Please run `node base` from root directory.'
    )
    return
  }

  const rebuildDB = async (config: ParsedConfig) => {
    for (let [k, v] of Object.entries(config.dbs)) {
      await buildDb({ name: k, url: v.url, cwd })
    }
    await buildWatch({
      input: join(cwd, 'pkgs', 'server', 'db', 'src', 'index.ts'),
      output: join(cwd, '.output', 'pkgs', 'server.db.js'),
      buildOptions: { minify: true, sourcemap: 'linked' },
      onReady: startServer,
    })
  }

  const startServer = throttle(async (path: string) => {
    if (path.endsWith('config.js')) {
      delete require.cache[path]
      const config = parseConfig(require(path).default, 'dev')
      rebuildDB(config)
      return;
    }

    if (exists(join(cwd, '.output', 'server.js'))) {
      Forker.run(join(cwd, '.output', 'server.js'), {
        arg: ['--mode', 'dev', ...process.argv.slice(4)],
      })
    }
  }, 1000)

  // build config
  await buildWatch({
    input: join(cwd, 'config.ts'),
    output: join(cwd, '.output', 'config.js'),
    buildOptions: { minify: true },
    onReady: startServer,
  })

  // build server/web
  await buildWatch({
    input: join(cwd, 'pkgs', 'server', 'web', 'src', 'index.ts'),
    output: join(cwd, '.output', 'pkgs', 'server.web.js'),
    buildOptions: { minify: true, sourcemap: 'linked' },
    onReady: startServer,
  })

  // build boot
  await buildWatch({
    input: join(cwd, 'pkgs', 'boot', 'src', 'index.ts'),
    output: join(cwd, '.output', 'server.js'),
    buildOptions: { minify: true, sourcemap: true },
    onReady: startServer,
  })
})()
