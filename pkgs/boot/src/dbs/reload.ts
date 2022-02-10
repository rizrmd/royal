import { execa } from 'execa'
import { pathExists } from 'fs-extra'
import { join } from 'path'
import { dirs } from '..'

export const dbsInspect = async (name: string) => {
  const path = join(dirs.app.dbs, name)
  if (!(await pathExists(path))) {
    console.log(`DB does not exists: ${path}`)
    return
  }

  await execa('pnpm', ['prisma', 'db', 'pull'], { stdio: 'inherit', cwd: path })
  await execa('pnpm', ['prisma', 'generate'], { stdio: 'inherit', cwd: path })
}

export const dbsGenerate = async (name: string) => {
  const path = join(dirs.app.dbs, name)
  if (!(await pathExists(path))) {
    console.log(`DB does not exists: ${path}`)
    return
  }

  await execa('npx', ['prisma', 'generate'], { stdio: 'inherit', cwd: path })
}
