import { fork } from 'child_process'

export default {
  start: async () => {
    return {} as Record<string, ReturnType<typeof fork>>
  },
  stop: () => {},
}
