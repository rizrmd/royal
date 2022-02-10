import { pathExists, remove } from 'fs-extra'
import { join } from 'path'
import { dirs } from '..'
import { reloadDbs } from './add'

export const dbsRemove = async (name: string) => {
  const path = join(dirs.app.dbs, name)
  if (!(await pathExists(path))) {
    console.log(`DB does not exists: ${path}`)
    return
  }
  await remove(path)
  await reloadDbs()
}
