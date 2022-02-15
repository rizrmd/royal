import { execa } from 'execa'
import { copy, pathExists, readJson, remove, writeJson } from 'fs-extra'
import { join } from 'path'
import { dbsRepair } from './dbs/reload'
import { dirs } from './dirs'
import { EXECA_FULL_COLOR } from './logging'
import { runPnpm } from './runner'

export const buildProd = async () => {
  if (
    (await pathExists(join(dirs.app.dbs, 'db'))) &&
    (await pathExists(join(dirs.app.dbs, 'db', 'prisma', 'schema.prisma'))) &&
    !(await pathExists(join(dirs.app.dbs, 'db', 'node_modules', '.prisma')))
  ) {
    await dbsRepair('db')
  }

  const vite = execa(
    join(dirs.app.web, 'node_modules', '.bin', 'vite'),
    ['build'],
    { ...EXECA_FULL_COLOR, cwd: dirs.app.web }
  )
  let isDone = false
  vite.stdout?.on('data', (e) => {
    process.stdout.write(e)
    if (e.indexOf('localhost') > 0 && !isDone) {
      isDone = true
    }
  })
  vite.stderr?.pipe(process.stdout)
  await vite

  if (await pathExists(join(dirs.app.mobile, 'www'))) {
    await remove(join(dirs.app.mobile, 'www'))
    await copy(join(dirs.app.web, 'build'), join(dirs.app.mobile, 'www'))
    await runPnpm(['cap', 'sync'], dirs.app.mobile)
  }

  const capConfigFile = join(dirs.app.mobile, 'capacitor.config.json')
  if (await pathExists(capConfigFile)) {
    const json = await readJson(capConfigFile)
    delete json.server
    await writeJson(capConfigFile, json, { spaces: 2 })
  }
}
