import type { ParsedConfig } from 'boot/dev/config-parse'
import { fork } from 'child_process'
import type dbs from 'dbs'

export default {
  start: (arg: { dbs: typeof dbs; config: ParsedConfig }) => {},
  stop: () => {},
}
