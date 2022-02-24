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

  for (let d of await readdir(join(dirs.root, 'pkgs'))) {
    let dir = join(dirs.root, 'pkgs', d, 'node_modules')
    if (await pathExists(dir)) {
      await remove(dir)
    }

    if (d === 'web') {
      for (let d of await readdir(dir)) {
        const subdir = join(dir, d, 'node_modules')
        if (await pathExists(subdir)) {
          await remove(subdir)
        }
      }
    }
  }
}
