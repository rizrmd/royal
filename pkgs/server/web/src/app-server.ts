import { AppServer } from './types'
import { join, sep } from 'path'

const g = global as any

export const getAppServer = async () => {
  if (!g.app) {
    g.app = {}
    if (__dirname.split(sep).join('/').endsWith('.output/pkgs')) {
      const app = require(join(__dirname, 'server.app.js')).default
      if (app) {
        g.app = app
      }
    }
    if (__dirname.startsWith('/snapshot/.output')) {
      const app = require(join(__dirname, 'pkgs', 'server.app.js')).default
      if (app) {
        g.app = app
      }
    }
  } 

  return g.app as AppServer
}
