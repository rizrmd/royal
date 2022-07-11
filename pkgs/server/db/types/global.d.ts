import { ParsedConfig } from 'boot/dev/config-parse'
import { fork } from 'child_process'

declare global {
  const config: ParsedConfig
  const dbQueue: Record<string, (result: any) => void>
  const forks: Record<string, ReturnType<typeof fork> & { ready: boolean }>
}

export {}
