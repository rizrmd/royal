import fs from 'fs'
import { copy, pathExists, readdir, remove } from 'fs-extra'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import { tmpdir } from 'os'
import { join } from 'path'
import { dirs, log, timelog } from '../'
export const basePull = async () => {
  const dir = join(tmpdir(), 'andro-base')
  if (await pathExists(dir)) {
    let done = timelog('base', 'Cleaning base dir')
    await remove(dir)
    done()
  }
  log('base', `tempdir: ${dir}`)
  let done = timelog('base', 'Pulling base from github')

  await git.clone({
    fs,
    http,
    url: 'https://github.com/rizkyramadhan/royal',
    dir,
    depth: 1,
  })
  done()

  await remove(join(dirs.root, 'pkgs'))
  await copy(join(dir, 'pkgs'), join(dirs.root, 'pkgs'))

  for (let [k, v] of Object.entries(dirs.pkgs)) {
    if (k !== 'web') {
      await remove(join(v, 'node_modules'))
    } else {
      const webDirs = await readdir(v)
      for (let d of webDirs) {
        await remove(join(v, d, 'node_modules'))
      }
    }
  }
  await remove(join(dirs.root, 'node_modules'))
}
