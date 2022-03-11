import { ensureDir, pathExists, remove } from 'fs-extra'
import { join, resolve } from 'path'
import { dirs } from '../dirs'
import { migrateOldExt } from './ext'
import { migrateOldPage } from './page'

export const migrateOld = async (oldPath: string) => {
  const root = resolve(oldPath)
  const path = {
    root: root,
    web: join(root, 'app', 'web'),
    base: join(root, 'app', 'web', 'src', 'base'),
  }

  const target = {
    page: join(dirs.app.web, 'src', 'base', 'page', 'migrate'),
  }

  let ext = {} as Record<string, string>
  if (await pathExists(join(path.web, 'src', 'external.tsx'))) {
    ext = await migrateOldExt(join(path.web, 'src', 'external.tsx'), root)
  }

  if (await pathExists(join(path.base, 'page'))) {
    if (await pathExists(target.page)) {
      await remove(target.page)
    }
    await ensureDir(target.page)
    await migrateOldPage(join(path.base, 'page'), ext)
  }
}
