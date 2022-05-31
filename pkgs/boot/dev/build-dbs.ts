import { exists, writeAsync } from 'fs-jetpack'
import { join } from 'path'
import { buildWatch } from './build-watch'
import { ParsedConfig } from './config-parse'

export const buildDbs = async (
  cwd: string,
  config: ParsedConfig,
  startServer: any
) => {
  await writeAsync(
    join(cwd, 'app', 'dbs', 'dbs.ts'),
    `\
  ${Object.keys(config.dbs)
    .map((e) => `import { db as dbs_${e} } from './${e}/index'`)
    .join('\n')}
  
  export default {
    ${Object.keys(config.dbs)
      .map((e) => `db: dbs_${e}`)
      .join(',\n  ')}
  }`
  )

  if (!exists(join(cwd, 'app', 'dbs', 'package.json'))) {
    await writeAsync(join(cwd, 'app', 'dbs', 'package.json'), {
      name: 'dbs',
      version: '1.0.0',
      private: true,
      main: './dbs.ts',
      dependencies: {},
    })
  }

  await buildWatch({
    input: join(cwd, 'pkgs', 'server', 'db', 'src', 'index.ts'),
    output: join(cwd, '.output', 'pkgs', 'server.db.js'),
    buildOptions: { minify: true, sourcemap: 'linked' },
    onReady: startServer,
  })
}
