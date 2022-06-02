import { unzip } from 'fflate'
import { readFileSync } from 'fs'
import { dir, dirAsync, exists, list } from 'fs-jetpack'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { BaseClient } from './config-parse'
import { pnpm } from './pnpm-runner'
import { watch } from 'chokidar'
import { reloadPage } from './client/page'
import { reloadLayout } from './client/layout'
import { reloadAPI } from './client/api'
import { reloadAuth } from './client/auth'
import { clientDir } from './client/util'

export const buildClient = async (arg: {
  cwd: string
  name: string
  config: BaseClient
}) => {
  const { cwd, name, config } = arg

  const cdir = join(arg.cwd, 'app', name)
  clientDir.root = cdir
  clientDir.page = join(cdir, 'src', 'base', 'page')
  clientDir.pageOut = join(cdir, 'types', 'page.ts')
  clientDir.layout = join(cdir, 'src', 'base', 'layout')
  clientDir.layoutOut = join(cdir, 'types', 'layout.ts')
  clientDir.api = join(cdir, 'src',  'api')
  clientDir.apiOut = join(cdir, 'types', 'api.ts')
  clientDir.auth = join(cdir, 'src',  'auth')
  clientDir.authOut = join(cdir, 'types', 'auth.ts')


  dir(cdir)

  const cdirList = list(cdir)
  if (!cdirList || (cdirList && cdirList.length === 0)) {
    const zipFile = readFileSync(join(arg.cwd, 'pkgs', 'boot', 'client.zip'))
    await new Promise<void>((res) => {
      unzip(zipFile, {}, async (_: any, content: any) => {
        const promises: any[] = []
        for (let [path, file] of Object.entries(content || []) as any) {
          const cpath = join(cdir, path.substring(7))
          if (file.length === 0) {
            await dirAsync(cpath)
            continue
          }
          promises.push(
            writeFile(cpath, file, {
              mode: 0o777,
            })
          )
        }
        await Promise.all(promises)
        res()
      })
    })
  }

  if (!exists(join(cdir, 'node_modules'))) {
    await pnpm(['install'], {
      cwd: cdir,
      name,
    })
  }

  watch(clientDir.auth).on('all', reloadAuth)
  watch(clientDir.api).on('all', reloadAPI)
  watch(clientDir.page).on('all', reloadPage)
  watch(clientDir.auth).on('all', reloadLayout)
}
