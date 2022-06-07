import { spawn } from 'cross-spawn'
import { join } from 'path'

export const runProd = async () => {
  const res = spawn(
    process.execPath,
    [join(process.cwd(), '.output', 'server.js')],
    {
      cwd: join(process.cwd(), '.output'),
      shell: true,
    }
  )
  res.stdout.pipe(process.stdout)
  res.stderr.pipe(process.stderr)
}
