import { spawn } from 'child_process'
import { log, silentUpdate } from 'server-utility'

export const pnpm = async (
  args: string[],
  opt: { cwd: string; name: string; stdout?: boolean }
) => {
  return new Promise<void>((resolve) => {
    silentUpdate(true)
    const cwd = process.cwd()
    const res = spawn('pnpm', args, {
      cwd: opt.cwd,
      shell: true,
    })
    if (opt.stdout) {
      res.stdout.pipe(process.stdout)
    }
    process.chdir(cwd)
    log(`[${opt.name}] pnpm ${args.join(' ')}`)
    res.on('error', (e) => {
      log(`[ERROR] ${e}`)
    })
    res.on('exit', () => {
      silentUpdate(false)
      resolve()
    })
  })
}
