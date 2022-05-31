import { exists, writeAsync } from 'fs-jetpack'
import { join } from 'path'
import { buildWatch } from './build-watch'
import { ParsedConfig } from './config-parse'

export const buildDbs = async (cwd: string, config: ParsedConfig) => {
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

  await buildWatch({
    input: join(cwd, 'pkgs', 'server', 'db', 'src', 'index.ts'),
    output: join(cwd, '.output', 'pkgs', 'server.db.js'),
    buildOptions: { minify: true, sourcemap: 'linked' },
  })
}
