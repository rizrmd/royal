import { execa, ExecaChildProcess } from 'execa'
import { ensureDir, pathExists, readFileSync, writeFile } from 'fs-extra'
import { join } from 'path'
import { unzip } from 'zlib'
import { dbsRepair } from './dbs/reload'
import { dirs } from './dirs'
import { findFreePorts, waitUntil } from './utils'

export const EXECA_FULL_COLOR = {
  cwd: dirs.root,
  all: true,
  env: { FORCE_COLOR: 'true' },
} as any

export const runDev = (args?: string[]) => {
  return new Promise<void>(async (resolve) => {
    if (!(await pathExists(join(dirs.root, 'app')))) {
      const zipFile = readFileSync(join(dirs.pkgs.boot, 'app.zip'))
      await new Promise<void>((res) => {
        unzip(zipFile, {}, async (error: any, content: any) => {
          const promises: any[] = []
          for (let [path, file] of Object.entries(content) as any) {
            if (file.length === 0) {
              await ensureDir(join(dirs.root, path))
              continue
            }
            promises.push(
              writeFile(join(dirs.root, path), file, {
                mode: 0o777,
              })
            )
          }
          await Promise.all(promises)
          res()
        })
      })

      await runPnpm(['i'], dirs.root)
      await waitUntil(
        async () => await pathExists(join(dirs.app.web, 'node_modules'))
      )
    }

    if (
      (await pathExists(join(dirs.app.dbs, 'db'))) &&
      (await pathExists(join(dirs.app.dbs, 'db', 'prisma', 'schema.prisma'))) &&
      !(await pathExists(join(dirs.app.dbs, 'db', 'node_modules', '.prisma')))
    ) {
      await dbsRepair('db')
    }

    const ports = await findFreePorts()
    const port = ports.pop()?.toString() || '3000'
    await writeFile(join(dirs.app.web, 'node_modules', 'viteport'), port)

    const vite = execa(
      join(dirs.app.web, 'node_modules', '.bin', 'vite'),
      [...(args || ['dev']), '--port', port],
      { ...EXECA_FULL_COLOR, cwd: dirs.app.web }
    )
    let isDone = false
    vite.stdout?.on('data', (e) => {
      process.stdout.write(e)
      if (e.indexOf('localhost') > 0 && !isDone) {
        isDone = true
        resolve()
      }
    })
    vite.stderr?.pipe(process.stdout)
  })
}

export let platformRunner: ExecaChildProcess = null as any
let lastPort = 3200
export const runPlatform = async (mode: 'dev' | 'prod', port?: number) => {
  if (platformRunner !== null) {
    platformRunner.kill()
  }

  if (port) {
    lastPort = port
  }

  platformRunner = execa(
    join(dirs.root, 'node_modules', '.bin', 'esr'),
    [join(dirs.pkgs.platform, 'src', 'start.ts'), mode, lastPort.toString()],
    {
      ...EXECA_FULL_COLOR,
      cwd: dirs.root,
    }
  )
  platformRunner.stdout?.pipe(process.stdout)
  platformRunner.stderr?.pipe(process.stdout)
}

export const runPnpm = async (args: string[], cwd: string) => {
  if (args[1] === '?') {
    args.pop()
  }
  const vite = execa('pnpm', args, { ...EXECA_FULL_COLOR, cwd })
  vite.stdout?.pipe(process.stdout)
  vite.stderr?.pipe(process.stdout)
}
