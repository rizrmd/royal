import { watch } from 'chokidar'
import { dirAsync, exists, writeAsync } from 'fs-jetpack'
import throttle from 'lodash.throttle'
import { join } from 'path'
import { reloadAPI } from './client/api'
import { ParsedConfig } from './config-parse'
import { pnpm } from './pnpm-runner'

export const rebuildAppServer = async (arg: {
  cwd: string
  config: ParsedConfig
  watch: boolean
}) => {
  const { cwd, config } = arg
  const asdir = join(cwd, 'app', 'server')
  if (!exists(join(asdir, 'package.json'))) {
    await newSource(asdir)
  }

  watch(join(cwd, 'app', 'server', 'src', 'api')).on(
    'all',
    reloadAPI.bind({ cwd })
  )

  if (!exists(join(asdir, 'node_modules'))) {
    await pnpm(['install'], {
      cwd: asdir,
      name: 'ext',
      stdout: arg.watch,
    })
  }
}

const newSource = async (extdir: string) => {
  await writeAsync(
    join(extdir, 'package.json'),
    JSON.stringify(
      {
        name: 'app-server',
        version: '1.0.0',
        private: true,
        scripts: {},
        dependencies: {
          bcryptjs: '^2.4.3',
          'server-web': 'workspace:^',
          'web-init': 'workspace:^',
        },
        devDependencies: {
          '@types/bcryptjs': '^2.4.2',
        },
        main: './src/index.ts',
      },
      null,
      2
    )
  )

  await dirAsync(join(extdir, 'api'))
  await writeAsync(join(extdir, 'src', 'api.ts'), `export default {};`)

  await writeAsync(
    join(extdir, 'src', 'index.ts'),
    `\
import { AppServer } from 'server-web/src/types'

export default {
  ext: {
    Password: require('./bcrypt'),
  },
  api: import('./api'),
  init: async (root) => {},
  workerStarted: async (app) => {},
} as AppServer
`
  )

  await writeAsync(
    join(extdir, 'src', 'bcrypt.ts'),
    `\
import BCrypt from 'bcryptjs'

export const name = 'PASSWORD_BCRYPT'

export var expression = /\$(2[a|x|y])\$(\d+)\$(.{53})/g
var defaultOptions = {
cost: 10,
}

export function verify(password: string, hash: string) {
expression.lastIndex = 0
const match = expression.exec(hash)
if (match) {
  hash = '$2a$' + match[2] + '$' + match[3]
  return BCrypt.compareSync(password, hash)
}
return false
}

export function hash(
password: string,
options?: { cost?: number; salt?: string }
) {
expression.lastIndex = 0
var salt
if (typeof options == 'undefined') {
  options = defaultOptions
}
if (typeof options.cost == 'undefined') {
  options.cost = defaultOptions.cost
}
if (options.cost < defaultOptions.cost) {
  options.cost = defaultOptions.cost
}
if (typeof options.salt !== 'undefined') {
  console.log(
    "Warning: Password.hash(): Use of the 'salt' option to Password.hash is deprecated"
  )
  if (options.salt.length < 16) {
    throw (
      'Provided salt is too short: ' + options.salt.length + ' expecting 16'
    )
  }
  salt = '$2y$' + options.cost + '$' + options.salt
} else {
  salt = BCrypt.genSaltSync(options.cost)
}
var hash = BCrypt.hashSync(password, salt)
var output = expression.exec(hash)
if (output) {
  return '$2y$' + options.cost + '$' + output[3]
} else return ''
}

export function cost(hash: string) {
expression.lastIndex = 0
var match = expression.exec(hash)
if (match && typeof match[2] !== 'undefined') {
  return parseInt(match[2])
}
return 0
}
    `
  )
}
