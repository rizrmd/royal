import arg from 'arg'
import { dirname, join } from 'path'
import { Forker } from 'server-utility'
import type web from 'server-web'
import type db from 'server-db'

const varg = arg({ '--mode': String })
const mode = (Forker.mode = varg['--mode'] === 'dev' ? 'dev' : 'prod')

const cwd = dirname(__filename)

const server = {
  paths: {
    web: join(cwd, 'pkgs', 'server.web.js'),
    db: join(cwd, 'pkgs', 'server.db.js'),
  },
  db: null as unknown as typeof db,
  web: null as unknown as typeof web,
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
      server.web.stop()
    },
  })
}

// require server subpkgs
for (let [key, path] of Object.entries(server.paths)) {
  ;(server as any)[key] = require(path).default
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

  server.web.start(await server.db.start())
})()
