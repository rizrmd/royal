import git from 'isomorphic-git'
import fs from 'fs'
import { Command, Option } from 'commander'
import { prettyError } from 'server-utility'
import { runDev } from './run-dev'
import { readAsync, removeAsync, writeAsync } from 'fs-jetpack'
import { join } from 'path'
import { prodBuild as viteBuild } from '../prod/vite-build'
import { runProd } from '../prod/run-prod'
const program = new Command()
prettyError()

program
  .name('node base')
  .description('Royal Base Framework')
  .version('1.0.0')
  .argument('[debug]', 'run with debugging')
  .addOption(new Option('-p, --port <number>', 'port number'))
  .addOption(new Option('-f, --force', 'force vite refresh cache'))
  .action(async (arg, opt) => {
    await runDev(true)
  })

program
  .command('precommit')
  .description('pre commit hook')
  .action(async () => {
    try {
      const url = await git.getConfig({
        fs,
        dir: process.cwd(),
        path: 'remote.origin.url',
      })
      const gitIgnorePath = join(process.cwd(), '.gitignore')
      const ignored = ((await readAsync(gitIgnorePath, 'utf8')) || '').split(
        '\n'
      )

      if (url === 'https://github.com/rizrmd/royal') {
        if (ignored.indexOf('app') < 0) {
          ignored.push('app')
          await writeAsync(gitIgnorePath, ignored.join('\n'))
        }
      } else {
        const idx = ignored.indexOf('app')
        if (idx >= 0) {
          ignored.splice(idx, 1)
          await writeAsync(gitIgnorePath, ignored.join('\n'))
        }
      }
    } catch (e) {}
  })

const dbs = program.command('dbs').description('database configuration')
dbs
  .command('add')
  .alias('i')
  .argument('<name>', 'db connection name')
  .description('add new database')
  .action((name) => {})
dbs
  .command('inspect')
  .argument('[name]', 'db connection name', 'db')
  .description('pull + generate database schema')
  .action(async (name) => {})
dbs
  .command('gen')
  .argument('[name]', 'db connection name', 'db')
  .description('generate database schema')
  .action(async (name) => {})
dbs
  .command('remove')
  .alias('r')
  .argument('[name]', 'db connection name', 'db')
  .description('remove database')
  .action((name) => {})

program
  .command('build')
  .description('build as production')
  .action(async () => {
    await removeAsync(join(process.cwd(), '.output'))
    await runDev(false)
    await viteBuild()
    process.exit(1)
  })

program
  .command('prod')
  .description('run as production')

  .argument('[serve]', 'skip build process, just run the server')
  .argument('[debug]', 'debug')
  .addOption(new Option('--port <number>', 'port number'))
  .action(async (serve, debug, _, a) => {
    if (!serve) {
      await runDev(false)
      await viteBuild()
    }

    await runProd()
  })

program
  .command('i')
  .alias('add')
  .alias('install')
  .description('install npm <package> to [dir]')
  .argument('<dir>', 'directory')
  .argument('[package]', 'npm package to install')
  .action(async (...args) => {})

program
  .command('clean')
  .description('clean node modules')

  .argument('[db]', 'also clean db node modules')
  .action(async () => {})

program
  .command('r')
  .alias('remove')
  .alias('delete')
  .alias('uninstall')
  .description('Remove npm <package> from [dir]')
  .argument('[dir]', 'directory')
  .argument('<package>', 'npm package to install')
  .action((...args) => {})

const pkgs = program.command('royal').description('Upstream royal repository')
pkgs
  .command('pull')
  .description('pull new pkgs from repository')
  .action((name) => {})
pkgs
  .command('push')
  .description('push current pkgs to repository')
  .argument('[dir]', 'commit message')
  .action(async (...args: any[]) => {})

program.parse()
