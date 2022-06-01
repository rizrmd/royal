import { Command, Option } from 'commander'
import { prettyError } from 'server-utility'
import { runDev } from './run-dev'
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
      await runDev()
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
  .command('prod')
  .description('run as production')

  .argument('[serve]', 'skip build process, just run the server')
  .argument('[debug]', 'debug')
  .addOption(new Option('--port <number>', 'port number'))
  .action(async (serve, debug, _, a) => {})

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
