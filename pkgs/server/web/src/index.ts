import type { ParsedConfig } from 'boot/dev/config-parse'
import dbs from 'dbs'

export default {
  start: async (arg: {
    dbs: typeof dbs
    config: ParsedConfig
    onStarted: () => void
  }) => {
    const { dbs } = arg

    const e = await dbs.db.m_port.findFirst()
    if (arg.onStarted) arg.onStarted()

    console.log('emang mantap', e)
  },
  stop: async () => {},
}
