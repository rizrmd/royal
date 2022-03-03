import epad from 'lodash.padstart'
import spad from 'lodash.padend'
import pad from 'lodash.pad'
import readline from 'readline'
import chalk from 'chalk'

import { join } from 'path'
const root = join(process.cwd())
const pkgs = join(root, 'pkgs')

const LOG_LEVEL = 1 as 1 | 2

export const dirs = {
  root,
  build: join(root, 'build'),
  app: {
    db: join(root, 'app', 'db'),
    web: join(root, 'app', 'web'),
    mobile: join(root, 'app', 'mobile'),
    server: join(root, 'app', 'server'),
  },
  pkgs: {
    boot: join(pkgs, 'boot'),
    main: join(pkgs, 'main'),
    docs: join(pkgs, 'docs'),
    dev: join(pkgs, 'dev'),
    figma: join(pkgs, 'figma'),
    libs: join(pkgs, 'libs'),
    web: join(pkgs, 'web'),
    builder: join(pkgs, 'builder'),
    platform: join(pkgs, 'platform'),
  },
}

export const ellapsedTime = (fromMs: number) => {
  const t1 = Math.round(new Date().getTime() - fromMs) / 1000
  return Math.round(t1 * 100) / 100
}

export const clearScreen = () => {
  const blank = '\n'.repeat(process.stdout.rows)
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

let lastTimeLog = {
  type: '',
  msg: '',
  depth: 0,
}
let parentTimeLog = {
  type: '',
  msg: '',
  depth: 0,
}

export const timelog = (type: string, msg: string, hasChildren = false) => {
  const ts = new Date().getTime()

  const typeArr = type.split('.')
  const lastType = typeArr[typeArr.length - 1]
  let depth = 0
  if (typeArr.length > 1) {
    depth = typeArr.length
    if (lastTimeLog.depth < depth && depth <= LOG_LEVEL) {
      console.log('')
    }
  }

  if (depth <= LOG_LEVEL) {
    if (depth === parentTimeLog.depth) {
      parentTimeLog.type = type
      parentTimeLog.msg = msg
      parentTimeLog.depth = depth
    }

    if (depth > 0) {
      log(lastType, ' ├ ' + spad(msg, 40 - ' ├ '.length), false)
    } else {
      log(lastType, spad(msg, 40), false)
    }
  }

  return (newLine?: boolean) => {
    const time = ellapsedTime(ts)
    let coloredTime = epad(time.toString(), 4, ' ')
    if (time <= 1) {
      coloredTime = chalk.green(coloredTime + 's')
    } else if (time > 1 && time <= 3) {
      coloredTime = chalk.yellow(coloredTime + 's')
    } else {
      coloredTime = chalk.red(coloredTime + 's')
    }

    if (depth <= LOG_LEVEL) {
      if (hasChildren) {
        lastTimeLog.depth = depth + 1
      }
      if (lastTimeLog.depth <= depth) {
        process.stdout.write(
          ` [ ${coloredTime} ]${newLine !== false ? '\n' : ''}`
        )
      } else if (lastTimeLog.depth > depth) {
        if (lastTimeLog.depth > LOG_LEVEL) {
          process.stdout.write(
            ` [ ${coloredTime} ]${newLine !== false ? '\n' : ''}`
          )
        } else {
          log(
            parentTimeLog.type,
            ' └ ' + spad('TOTAL TIME:', 40 - ' └ '.length),
            false
          )
          process.stdout.write(
            ` [ ${coloredTime} ]${newLine !== false ? '\n' : ''}`
          )
        }
      }
    }

    lastTimeLog.type = type
    lastTimeLog.msg = msg
    lastTimeLog.depth = depth
  }
}

export const hlog = (msg: string) => {}

export const EXECA_FULL_COLOR = {
  stdout: 'inherit',
  cwd: dirs.root,
  all: true,
  env: { FORCE_COLOR: 'true' },
} as any

export const logo = () => {
  const base = chalk.bold(`${chalk.green('Ro') + chalk.yellow('yal')}`)
  return chalk.gray(`[   ${base}  ]`)
}

export const welcomeToBase = (mode: 'dev' | 'prod', port: number) => {
  console.log(
    logo() +
      ` ${
        mode === 'dev'
          ? `Development [Port ${port}]`
          : `Production [Port ${port}]`
      }`
  )
}

export const log = (type: string, msg: string, newline = true) => {
  const strtype = chalk.gray(`[ ${pad(type, 9, ' ')}]`)
  const text = `${strtype} ${msg}${newline ? '\n' : ''}`

  process.stdout.write(text)
}
