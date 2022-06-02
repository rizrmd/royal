import { exists, writeAsync } from 'fs-jetpack'
import { join } from 'path'
import { ParsedConfig } from './config-parse'
import { pnpm } from './pnpm-runner'

export const rebuildExt = async (arg: {
  cwd: string
  config: ParsedConfig
}) => {
  const { cwd, config } = arg
  const extdir = join(cwd, 'app', 'ext')
  if (!exists(join(extdir, 'package.json'))) {
    await newSource(extdir)
  }

  if (!exists(join(extdir, 'node_modules'))) {
    await pnpm(['install'], {
      cwd: extdir,
      name: 'ext',
    })
  }
}

const newSource = async (extdir: string) => {
  await writeAsync(join(extdir, 'package.json'), {
    name: 'ext',
    version: '1.0.0',
    private: true,
    scripts: {},
    dependencies: {
      bcryptjs: '^2.4.3',
    },
    devDependencies: {
      '@types/bcryptjs': '^2.4.2',
    },
    main: './src/index.ts',
  })

  await writeAsync(
    join(extdir, 'src', 'index.ts'),
    `\
export default {
Password: require('./bcrypt')
}`
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
