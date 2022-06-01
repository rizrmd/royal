import type { ParsedConfig } from 'boot/dev/config-parse'
import { prettyError } from 'server-utility'
import { startServer, web } from './start-server'
prettyError()

if (process.send) {
  ;(async () => {
    process.on(
      'message',
      async (data: {
        action: 'init' | 'kill'
        config: ParsedConfig
        mode: 'dev' | 'prod'
      }) => {
        if (data.action === 'init') {
          await startServer(data.config, data.mode)

          if (process.send)
            process.send({ event: 'started', url: data.config.server.url })
        }
        if (data.action === 'kill' && web.server) {
          web.server.on('close', () => {
            process.exit(1)
          })
          web.server.close()
        }
      }
    )
  })()
}
