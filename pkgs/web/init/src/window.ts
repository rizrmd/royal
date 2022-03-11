import type * as dbs from 'dbs'

export interface BaseWindow {
  db: typeof dbs.db & { query: (sql: string) => Promise<any> }
}
