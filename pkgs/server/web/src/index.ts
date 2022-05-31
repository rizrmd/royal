import { fork } from 'child_process'

export default {
  start: (dbs: Record<string, ReturnType<typeof fork>>) => {},
  stop: () => {},
}
