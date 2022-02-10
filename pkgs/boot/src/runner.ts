import { execa, ExecaChildProcess } from 'execa'
import { writeFile } from 'fs-extra'
import { join } from 'path'
import { dirs } from './dirs'
import { findFreePorts } from './utils'

export const EXECA_FULL_COLOR = {
  cwd: dirs.root,
  all: true,
  env: { FORCE_COLOR: 'true' },
} as any

export const runDev = (args?: string[]) => {
  return new Promise<void>(async (resolve) => {
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
