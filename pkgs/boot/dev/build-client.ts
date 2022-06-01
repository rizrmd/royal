import { unzip } from 'fflate'
import { readFileSync } from 'fs'
import { dir, dirAsync, exists, list } from 'fs-jetpack'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { BaseClient } from './config-parse'
import { pnpm } from './pnpm-runner'

export const buildClient = async (arg: {
  cwd: string
  name: string
  config: BaseClient
}) => {
  const { cwd, name, config } = arg

  const cdir = join(arg.cwd, 'app', name)
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

  
}
