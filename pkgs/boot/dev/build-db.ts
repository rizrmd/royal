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
import { exit } from 'process'
import { pnpm } from './pnpm-runner'

export const buildDb = async (arg: {
  cwd: string
  name: string
  url: string
  watch: boolean
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
      stdout: arg.watch,
    })
    await pnpm(['prisma', 'init'], {
      cwd: dbpath,
      name: dbName,
      stdout: arg.watch,
    })
    await writeAsync(join(dbpath, '.env'), `DATABASE_URL="${url}"`)
    await pnpm(['prisma', 'db', 'pull'], {
      cwd: dbpath,
      name: dbName,
      stdout: arg.watch,
    })
    await pnpm(['prisma', 'generate'], {
      cwd: dbpath,
      name: dbName,
      stdout: arg.watch,
    })
  }

  await writeAsync(
    indexts,
    `\
import * as pc from './node_modules/.prisma/client'
export type db_type = pc.PrismaClient
export const db = new pc.PrismaClient() as unknown as pc.PrismaClient

if (process.send ) {
  ;(BigInt as any).prototype.toJSON = function () {
    return this.toString()
  }

  db.$connect().then(() => {
    if (process.send && process.connected) {
      process.send({ event: 'ready' })
    }
    process.on('message', async (data: any) => {
      if (process.send) {
        if (data.id) {
          if (typeof (db as any)[data.table] === 'function') {
            if (data.table.startsWith('$query')) {
              const q = data.params.shift()
              q.sql = true
              Object.freeze(q)
              let val = db[data.table](q, ...data.params)

              process.send({
                id: data.id,
                value: await val,
              })
            } else {
              const val = await (db as any)[data.table](...data.params)
              process.send({
                id: data.id,
                value: val,
              })
            }
            return
          }
          try {
            const val = await (db as any)[data.table][data.action](
              ...data.params
            )

            process.send({
              id: data.id,
              event: 'result',
              value: val,
            })
          } catch (e) {
            process.send({
              id: data.id,
              event: 'error',
              value: e,
            })
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

  try {
    await build({
      entryPoints: [indexts],
      outfile: join(cwd, '.output', 'pkgs', 'dbs', name, `db.js`),
      external: ['esbuild'],
      bundle: true,
      platform: 'node',
      minify: true,
      sourcemap: 'linked',
    })
  } catch (e) {
    throw new Error('Failed to build database')
  }

  if (!exists(join(cwd, '.output', 'pkgs', 'dbs', name, 'package.json'))) {
    await copyAsync(
      join(cwd, 'app', 'dbs', name, 'package.json'),
      join(cwd, '.output', 'pkgs', 'dbs', name, 'package.json')
    )
  }
}
