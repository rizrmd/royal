import arg from 'arg'
import { spawn } from 'child_process'
import { exists } from 'fs-jetpack'
import { dirname, join } from 'path'
import type db from 'server-db'
import { Forker, log, waitUntil } from 'server-utility'
import type web from 'server-web'
import { readConfig } from '../dev/config-parse'
import { npm } from './npm-run'

const varg = arg({ '--mode': String })
const mode = (Forker.mode = varg['--mode'] === 'dev' ? 'dev' : 'prod')

const cwd = dirname(__filename)

const server = {
  paths: {
    web: join(cwd, 'pkgs', 'server.web.js'),
    db: join(cwd, 'pkgs', 'server.db.js'),
  },
  db: null as null | typeof db,
  web: null as null | typeof web,
}

// clear cache when developing
if (mode === 'dev') {
  for (let i of Object.keys(server.paths)) {
    delete require.cache[i]
  }

  // create onKilled hooks when developing
  // so it can be live reloaded
  Forker.asChild({
    onKilled: () => {
      if (server.web) server.web.stop()
    },
  })
}

// require server subpkgs
for (let [key, path] of Object.entries(server.paths)) {
  if (exists(path)) {
    ;(server as any)[key] = require(path).default
  }
}

// start
;(async () => {
  // clear screen when dev
  if (mode === 'dev') {
    const args = varg._.slice(0, varg._.length - 1)
    if (args.length > 0) {
      return
    }
  }
  const config = await readConfig(mode)

  if (mode === 'prod') {
    for (let key of Object.keys(config.dbs)) {
      if (!exists(join(cwd, 'pkgs', 'dbs', key, 'node_modules'))) {
        await npm(['install'], {
          cwd: join(cwd, 'pkgs', 'dbs', key),
          name: 'dbs/' + key,
        })
      }
    }
  }

  await waitUntil(() => server.web && server.db)
  if (server.web && server.db) {
    // const res = require(join(cwd, 'pkgs/dbs/db/db.js')).default

    // res.m_port.findFirst().then((e: any) => {
    //   console.log(e)
    // })

    server.web.start({ dbs: await server.db.start(config), config })
  }
})()
