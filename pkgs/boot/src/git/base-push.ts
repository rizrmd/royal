import fs from 'fs'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import { copy, pathExists, readdir, remove } from 'fs-extra'
import { tmpdir } from 'os'
import { join } from 'path'
import inq from 'inquirer'
import { dirs, log, timelog } from '..'

export const basePush = async (arg: string[]) => {
  log('base', 'Requesting credentials...')

  const msg =
    arg.join(' ') ||
    (await getCommitMsg(arg)).trim().replace(/(\r\n|\n|\r)/gm, '')

  const username = 'rizkyramadhan'
  const token = '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'
  console.log('')

  const dir = join(tmpdir(), 'royal')
  if (await pathExists(dir)) {
    let done = timelog('royal', 'Cleaning royal dir')
    await remove(dir)
    done()
  }
  log('base', `tempdir: ${dir}`)
  let done = timelog('royal', 'Pulling royal from bitbucket')

  await git.clone({
    fs,
    http,
    url: 'https://github.com/rizkyramadhan/royal',
    dir,
    depth: 1,
    // onAuth: (url) => {
    //   return {
    //     username,
    //     password,
    //   }
    // },
  })
  done()

  const files = [
    '.gitignore',
    'package.json',
    'base.js',
    '.prettierrc',
    'pnpm-workspace.yaml',
  ]

  done = timelog('base', 'Copying pkgs')
  for (let [k, v] of Object.entries(dirs.pkgs)) {
    if (k !== 'web') {
      await copyPkgs(v, dir)
    } else {
      const webDirs = await readdir(v)
      for (let d of webDirs) {
        await copyPkgs(join(v, d), dir)
      }
    }
  }

  for (let i of files) {
    await copy(join(dirs.root, i), join(dir, i))
  }
  done()

  done = timelog('base', 'Committing repository')
  const status = await git.statusMatrix({ dir: dir, fs })
  await Promise.all(
    status.map(([filepath, , worktreeStatus]) =>
      worktreeStatus
        ? git.add({ fs, dir, filepath: filepath })
        : git.remove({ fs, dir, filepath: filepath })
    )
  )

  await git.commit({
    fs,
    author: { email: `rizky@andromedia.co.id`, name: username },
    message: msg,
    dir,
  })
  done()

  done = timelog('base', 'Pushing base to github')
  await git.push({
    fs,
    http,
    url: 'https://github.com/rizkyramadhan/royal',
    dir,
    onAuth: (url) => {
      return {
        username: 'token',
        password: token,
      } as any
    },
  })
  done()
}

const copyPkgs = async (dir: string, to: string) => {
  const subdir = dir.substring(join(dirs.root, 'pkgs').length)
  for (let i of await readdir(dir)) {
    if (i !== 'node_modules' && i !== 'build') {
      await copy(join(dir, i), join(to, 'pkgs', subdir, i))
    }
  }
}

const getGitUserPass = (msg: string) => {
  // prompt.message = '  '
  // prompt.delimiter = ''
  console.log('\nGithub login')
  return new Promise<{ username: string; password: string; msg: string }>(
    async (resolve) => {
      const answers = await inq.prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Username: ',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password: ',
        },
        {
          name: 'msg',
          default: msg,
          description: '  Commit Message:',
        },
      ])
      resolve(answers)
    }
  )
}

const getCommitMsg = async (arg: string[]) => {
  const lastCommit = await git.log({
    fs,
    dir: dirs.root,
    depth: 1,
  })

  let commitMsg = arg.slice(1).join('') || 'fix'
  if (lastCommit.length > 0) {
    commitMsg = lastCommit[0].commit.message
  }
  return commitMsg
}
