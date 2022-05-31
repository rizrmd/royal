import { exists, removeAsync } from 'fs-jetpack'
import { join } from 'path'
import { error, Forker, prettyError } from 'server-utility'
import { buildWatch } from './build-watch'
const cwd = process.cwd()

prettyError()
;(async () => {
  if (!exists(join(cwd, 'pkgs'))) {
    error(
      'Directory pkgs not found. Please run `node base` from root directory.'
    )
    return
  }
  await removeAsync(join(cwd, '.output'))

  const startServer = (path: string) => {
    Forker.run(path, {
      arg: ['--mode', 'dev', ...process.argv.slice(4)],
    })
  }

  // build server/web
  await buildWatch({
    input: join(cwd, 'pkgs', 'server', 'web', 'src', 'index.ts'),
    output: join(cwd, '.output', 'pkgs', 'server.web.js'),
    buildOptions: { minify: true, sourcemap: 'linked' },
    onReady: startServer,
  })

  // build server/db
  await buildWatch({
    input: join(cwd, 'pkgs', 'server', 'db', 'src', 'index.ts'),
    output: join(cwd, '.output', 'pkgs', 'server.db.js'),
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
