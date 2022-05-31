import type { ParsedConfig } from 'boot/dev/config-parse'
import { fork } from 'child_process'

export default {
  start: (arg: {
    dbs: Record<string, ReturnType<typeof fork>>
    config: ParsedConfig
  }) => {},
  stop: () => {},
}
