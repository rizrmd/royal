import { ParsedConfig } from 'boot/dev/config-parse'
import { fork } from 'child_process'
import { dirname, join } from 'path'
import { Forker } from 'server-utility'

export default {
  start: async (config: ParsedConfig) => {
    const dbsFork = {} as Record<string, ReturnType<typeof fork>>
    const cwd = join(dirname(__filename), '..')

    for (let dbName of Object.keys(config.dbs)) {
      const run = await Forker.run(join(cwd, 'pkgs', 'dbs', dbName, 'db.js'))
    }

    return {} as any
  },
  stop: () => {},
}
