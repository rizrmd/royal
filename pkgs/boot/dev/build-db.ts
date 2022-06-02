import { build } from 'esbuild'
import {
  copyAsync,
  dir,
  exists,
  removeAsync,
  write,
  writeAsync,
} from 'fs-jetpack'
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
  if (!exists(join(dbpath, 'node_modules', '.prisma', 'client'))) {
    if (exists(join(dbpath, 'node_modules'))) {
      await removeAsync(dbpath)
      dir(dbpath)
      write(join(dbpath, 'package.json'), {
        name,
        version: '1.0.0',
        private: true,
        main: './index.ts',
        dependencies: {},
        devDependencies: {},
      })
    }

    const dbName = dbpath.substring(process.cwd().length + 5)
    await pnpm(['install', 'prisma'], {
      cwd: dbpath,
      name: dbName,
      stdout: true,
    })
    await pnpm(['prisma', 'init'], { cwd: dbpath, name: dbName })
    await writeAsync(join(dbpath, '.env'), `DATABASE_URL="${url}"`)
    await pnpm(['prisma', 'db', 'pull'], { cwd: dbpath, name: dbName })
    await pnpm(['prisma', 'generate'], { cwd: dbpath, name: dbName })
  }

  await writeAsync(
    indexts,
    `\
import * as pc from './node_modules/.prisma/client'
export type db_type = pc.PrismaClient
export const db = new pc.PrismaClient() as unknown as pc.PrismaClient

if (process.send) {
  db.$connect().then(() => {
    if (process.send) {
      process.send({event: 'ready'})
    }
    process.on('uncaughtException', (e) => { process.exit(1) })
    process.on('unhandledRejection', (e) => { process.exit(1) })
    process.on('message', async (data: any) => {
      if (process.send) {
        if (data.id) {
          try {
            process.send({
              id: data.id,
              value: await (db as any)[data.table][data.action](...data.params),
            })
          } catch (e) {
            process.exit(1)
          }
        }
      }
    })
  })
}

`
  )

  if (!exists(join(cwd, 'app', 'dbs', name, 'prisma'))) {
    throw new Error(
      'File schema.prisma not found at: ' +
        join(cwd, 'app', 'dbs', name, 'prisma')
    )
  }
  await copyAsync(
    join(cwd, 'app', 'dbs', name, 'prisma'),
    join(cwd, '.output', 'pkgs', 'dbs', name, 'prisma'),
    {
      overwrite: true,
    }
  )

  if (!exists(join(cwd, 'app', 'dbs', name, '.env'))) {
    await writeAsync(join(dbpath, '.env'), `DATABASE_URL="${url}"`)
  }

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
