import { writeFile } from 'fs-extra'
import { basename, join } from 'path'
import { format } from 'prettier'
import { dirs } from '..'
import { walkDir } from '../utils'

export const layoutPath = {
  out: join(dirs.app.web, 'types', 'layout.ts'),
  dir: join(dirs.app.web, 'src', 'base', 'layout'),
}

export const generateLayout = async () => {
  const newLayouts: any = {}
  const list = await walkDir(layoutPath.dir)

  for (let i of list) {
    const name = basename(i.endsWith('.tsx') ? i.substring(0, i.length - 4) : i)
    newLayouts[name] = `() => import('..${i
      .substring(dirs.app.web.length, i.length - 4)
      .replace(/\\/gi, '/')}')`
  }
  const output = `export default {
  ${Object.entries(newLayouts)
    .map((arg: any) => {
      const [key, value] = arg
      return `'${key}':${value},`
    })
    .join('\n')}
    }`
  const formatted = format(output, { parser: 'babel' })
  await writeFile(layoutPath.out, formatted)
}
