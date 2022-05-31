import { ParsedConfig } from 'boot/dev/config-parse'
import { fork } from 'child_process'

export default {
  start: async (config: ParsedConfig) => {
    return {} as Record<string, ReturnType<typeof fork>>
  },
  stop: () => {},
}
