import { build } from 'esbuild'
import { copyAsync, dir, exists, write, writeAsync } from 'fs-jetpack'
import { join } from 'path'
import { pnpm } from './pnpm-runner'

export const buildDb = async (arg: {
  cwd: string
  name: string
  url: string
}) => {
  const { cwd, name, url } = arg
  const dbpath = join(cwd, 'app', 'dbs', name)
  dir(dbpath)

  if (!exists(join(dbpath, 'package.json'))) {
    write(join(dbpath, 'package.json'), {
      name,
      version: '1.0.0',
      private: true,
      main: './index.ts',
      dependencies: {},
      devDependencies: {},
    })
  }

  const indexts = join(dbpath, 'index.ts')
  if (!exists(join(dbpath, 'node_modules'))) {
    const name = dbpath.substring(process.cwd().length + 5)
    await pnpm(['install', 'prisma'], { cwd: dbpath, name, stdout: true })
    await pnpm(['prisma', 'init'], { cwd: dbpath, name })
    await writeAsync(join(dbpath, '.env'), `DATABASE_URL="${url}"`)
    await pnpm(['prisma', 'db', 'pull'], { cwd: dbpath, name })
    await pnpm(['prisma', 'generate'], { cwd: dbpath, name })
  }

  await writeAsync(
    indexts,
    `\
import * as pc from './node_modules/.prisma/client'
export const db = new pc.PrismaClient() as unknown as pc.PrismaClient

if (process.send) {
  process.on('message', async (data:any) => {
    if (data.event === 'exec') {
      (0, eval)(data.script)
    }
  })
}`
  )

  await copyAsync(
    join(cwd, 'app', 'dbs', name, 'prisma'),
    join(cwd, '.output', 'pkgs', 'dbs', name, 'prisma'),
    {
      overwrite: true,
    }
  )

  await copyAsync(
    join(cwd, 'app', 'dbs', name, '.env'),
    join(cwd, '.output', 'pkgs', 'dbs', name, '.env'),
    {
      overwrite: true,
    }
  )

  await build({
    entryPoints: [indexts],
    outfile: join(cwd, '.output', 'pkgs', 'dbs', name, `db.js`),
    external: ['esbuild'],
    bundle: true,
    platform: 'node',
    minify: true,
    sourcemap: 'linked',
  })

  if (!exists(join(cwd, '.output', 'pkgs', 'dbs', name, 'package.json'))) {
    await copyAsync(
      join(cwd, 'app', 'dbs', name, 'package.json'),
      join(cwd, '.output', 'pkgs', 'dbs', name, 'package.json')
    )
  }
}
