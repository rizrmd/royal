import { execa, ExecaChildProcess } from 'execa'
import { unzip } from 'fflate'
import {
  ensureDir,
  pathExists,
  readFileSync,
  readJson,
  writeFile,
  writeFileSync,
  writeJson,
} from 'fs-extra'
import { join } from 'path'
import { dbsRepair } from './dbs/reload'
import { dirs } from './dirs'
import { findFreePorts } from './utils'

export const EXECA_FULL_COLOR = {
  cwd: dirs.root,
  all: true,
  env: { FORCE_COLOR: 'true' },
} as any

export const runDev = (args: string[], port: number) => {
  return new Promise<void>(async (resolve) => {
    if (!(await pathExists(join(dirs.root, 'app')))) {
      const zipFile = readFileSync(join(dirs.pkgs.boot, 'app.zip'))
      await new Promise<void>((res) => {
        unzip(zipFile, {}, async (error: any, content: any) => {
          const promises: any[] = []

          for (let [path, file] of Object.entries(content || []) as any) {
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
    }

    if (
      (await pathExists(join(dirs.app.dbs, 'db'))) &&
      (await pathExists(join(dirs.app.dbs, 'db', 'prisma', 'schema.prisma'))) &&
      !(await pathExists(join(dirs.app.dbs, 'db', 'node_modules', '.prisma')))
    ) {
      if (!(await dbsRepair('db'))) {
        return
      }
    }

    const ports = await findFreePorts()
    const vitePort = ports.pop()?.toString() || '3000'
    await writeFile(join(dirs.app.web, 'node_modules', 'viteport'), vitePort)

    const vite = execa(
      join(dirs.app.web, 'node_modules', '.bin', 'vite'),
      [...(args || ['dev']), '--host', '--port', vitePort],
      { ...EXECA_FULL_COLOR, cwd: dirs.app.web }
    )
    let isDone = false
    console.log('  Preparing Dev Server')
    vite.stdout?.on('data', (e) => {
      if (!isDone) {
        const rows = e.toString('utf-8').split('\n')
        for (let i of rows) {
          if (i.indexOf('ready') > 0) {
            process.stdout.write(i + '\n')
          }
        }
      } else {
        process.stdout.write(e)
      }
      if (e.indexOf('ready') >= 0 && !isDone) {
        isDone = true
        resolve()
      }
    })
    vite.stderr?.pipe(process.stdout)
  })
}

export let platformRunner: ExecaChildProcess = null as any
let lastPort = 3200
export const runPlatform = async (
  mode: 'dev' | 'prod',
  port?: number,
  debug?: boolean
) => {
  if (platformRunner !== null) {
    platformRunner.kill()
  }

  if (port) {
    lastPort = port
  }
  platformRunner = execa(
    join(dirs.root, 'node_modules', '.bin', 'esr'),
    [
      join(dirs.pkgs.platform, 'src', 'start.ts'),
      mode + (debug ? '-debug' : ''),
      lastPort.toString(),
    ],
    {
      ...EXECA_FULL_COLOR,
      cwd: dirs.root,
    }
  )
  platformRunner.stdout?.pipe(process.stdout)
  platformRunner.stderr?.pipe(process.stdout)
  await platformRunner
}

export const runPnpm = async (args: string[], cwd: string) => {
  if (args[1] === '?') {
    args.pop()
  }
  const pnpm = execa('pnpm', args, { ...EXECA_FULL_COLOR, cwd })
  pnpm.stdout?.pipe(process.stdout)
  pnpm.stderr?.pipe(process.stdout)
  await pnpm
}
