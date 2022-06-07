import { writeAsync } from 'fs-jetpack'
import { join } from 'path'
import { buildWatch } from './build-watch'
import type { ParsedConfig } from './config-parse'

export const buildDbs = async (
  cwd: string,
  config: ParsedConfig,
  watch: boolean
) => {
  await writeAsync(
    join(cwd, 'app', 'dbs', 'dbs.ts'),
    `\
  ${Object.keys(config.dbs)
    .map(
      (e) => `\
import type { db_type as dbs_${e}_type } from './${e}/index'
import { db as dbs_${e} }from './${e}/index'`
    )
    .join('\n')}
  
  export default {
    ${Object.keys(config.dbs)
      .map((e) => `db: dbs_${e} as dbs_${e}_type`)
      .join(',\n  ')}
  }`
  )

  for (let app of Object.keys(config.client)) {
    await writeAsync(
      join(cwd, 'app', app, 'types', 'dbs-list.ts'),
      `export const dbsList = [${Object.keys(config.dbs).map(
        (e) => `"${e}"`
      )}] as const`
    )
  }

  await buildWatch({
    input: join(cwd, 'pkgs', 'server', 'db', 'src', 'index.ts'),
    output: join(cwd, '.output', 'pkgs', 'server.db.js'),
    watch,
    buildOptions: { minify: true, sourcemap: 'linked' },
  })
}
