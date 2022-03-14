import { join } from 'path'
import { cwd } from 'process'

const root = cwd()
export const dirs = {
  root,
  app: {
    dbs: join(root, 'app', 'dbs'),
    web: join(root, 'app', 'web'),
    ext: join(root, 'app', 'ext'),
    mobile: join(root, 'app', 'mobile'),
  },
  pkgs: {
    fastify: join(root, 'pkgs', 'fastify'),
    platform: join(root, 'pkgs', 'platform'),
    boot: join(root, 'pkgs', 'boot'),
    theme: join(root, 'pkgs', 'theme'),
    web: join(root, 'pkgs', 'web'),
  },
}
