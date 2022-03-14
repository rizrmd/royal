import chokidar from 'chokidar'
import { Stats, writeFile } from 'fs-extra'
import { log } from '.'
import { authPath } from './loader/auth'
import { generateLayout, layoutPath } from './loader/layout'
import {
  apiPath,
  generatePage,
  generatePageSingle,
  pagePath,
} from './loader/page'
import { platformRunner, runPlatform } from './runner'

export const autoload = async (mode: 'dev' | 'prod') => {
  if (mode === 'dev') {
    const layout = chokidar.watch(layoutPath.dir)
    layout.on('add', reloadLayout)
    layout.on('unlink', reloadLayout)

    const api = chokidar.watch(apiPath.dir, { ignoreInitial: true })
    api.on('all', restartPlatform)

    const page = chokidar.watch(pagePath.dir)
    page.on('all', reloadPage)

    const auth = chokidar.watch(authPath.dir, {
      ignoreInitial: true,
    })
    auth.on('all', restartPlatform)
  } else {
    await reloadLayout('add', '')
    await reloadPage('add', '')
  }
}

let restartPlatformTimer = 0 as any
const restartPlatform = async (event: string, path: string) => {
  if (platformRunner === null) return
  clearTimeout(restartPlatformTimer)
  restartPlatformTimer = setTimeout(async () => {
    log('platform', 'Restarting...')
    runPlatform('dev')
  }, 300)
}

const reloadLayout = async (
  event: 'add' | 'unlink',
  path: string,
  stats?: Stats | undefined
) => {
  generateLayout()
}

let reloadPageTimer: NodeJS.Timeout = 0 as any
const reloadPage = async (
  event: string,
  path: string,
  stats?: Stats | undefined
) => {
  if (event === 'addDir') return
  if (event === 'unlink') await writeFile(pagePath.out, '')

  if (event !== 'unlink' && event !== 'unlinkDir' && event !== 'add') {
    generatePageSingle(path)
    return
  }

  clearTimeout(reloadPageTimer)
  reloadPageTimer = setTimeout(async () => {
    generatePage()
  }, 500)
}
