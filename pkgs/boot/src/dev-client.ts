import { ChildProcess, exec } from 'child_process'
import { exists } from 'fs-jetpack'
import { join } from 'path'
import { log } from 'server-utility'
import { formatTs, IApp } from '.'
import { ParsedConfig } from '../dev/config-parse'

export const startDevClient = async (
  config: ParsedConfig,
  app: IApp,
  cwd: string
) => {
  let idx = 1
  for (let [name, client] of Object.entries(config.client)) {
    const port = parseInt(new URL(config.server.url).port) + idx
    const path = join(process.cwd(), 'app', name)
    const vitecli = join(path, 'node_modules', '.bin', 'vite')
    if (!exists(vitecli)) {
      log(`[WARNING] ${vitecli} not found.`)
      log(`          Cannot run development server for app/${name}`)
      continue
    }

    const ts = new Date().getTime()
    app.client[name] = exec(`${vitecli} --port=${port} --host`, { cwd: path })
    app.client[name].stderr?.pipe(process.stderr)
    app.client[name].stdout?.on('data', (e) => {
      e.split('\n').forEach((str: string) => {
        if (str.indexOf('Local: ') >= 0) {
          const devHost = str.split('Local: ').pop()?.trim()
          const host = client.url.replace(`[server.url]`, config.server.url)
          log(`[${formatTs(ts)}] Vite Dev [app/${name}] at: ${devHost}`)
          if (host.startsWith(config.server.url)) {
            log(`          proxied to ${host}`)
          }
        }
      })
    })
  }
}
