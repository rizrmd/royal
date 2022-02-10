import { execa } from 'execa'
import { ensureDir, pathExists, readdir, writeFile, writeJson } from 'fs-extra'
import { join } from 'path'
import { dirs } from '..'

export const dbsAdd = async (name: string) => {
  const path = join(dirs.app.dbs, name)
  if (await pathExists(path)) {
    console.log(`DB exists: ${path}`)
    return
  }

  await ensureDir(path)
  await execa('pnpx', ['--yes', 'prisma', 'init'], {
    stdio: 'inherit',
    cwd: path,
  })

  await writeJson(
    join(path, 'package.json'),
    {
      name: name,
      version: '1.0.0',
      private: true,
      main: './index.ts',
      dependencies: {
        '@prisma/client': '^3.9.1',
      },
      devDependencies: {
        prisma: '^3.9.1',
      },
    },
    {
      spaces: 2,
    }
  )

  await writeFile(
    join(path, 'index.ts'),
    `
import * as pc from './node_modules/.prisma/client'
export default new pc.PrismaClient() as unknown as pc.PrismaClient

`
  )

  await execa('npm', ['i'], { stdio: 'inherit', cwd: path })

  console.log(
    '\n\nAdding db successful, Please edit db connection: \n\n      ' +
      join(path, '.env') +
      '\n\nAfter that, please run: node base dbs inspect ' +
      name
  )
  reloadDbs()
}

export const reloadDbs = async () => {
  const imports = []
  const exports = []
  const types = []
  const list = []

  for (let k of await readdir(dirs.app.dbs, { withFileTypes: true })) {
    if (k.isDirectory()) {
      list.push(k.name)
      types.push(`const ${k.name}: typeof dbs.${k.name}`)
      imports.push(`import _${k.name} from './${k.name}/index'`)
      exports.push(`export const ${k.name} = _${k.name}`)
    }
  }

  await writeFile(
    join(dirs.app.dbs, 'index.ts'),
    `${imports.join('\n')}\n\n${exports.join('\n')}`
  )

  await writeFile(
    join(dirs.app.web, 'types', 'dbs.d.ts'),
    `\
import type * as dbs from 'dbs'

declare global {
  ${types.join('\n  ')}
}
  `
  )

  await writeFile(
    join(dirs.app.web, 'types', 'dbs-list.ts'),
    `
export const dbsList = ${JSON.stringify(list)} as const;
`
  )
}
