import { parse } from '@babel/core'
import pluginJsx from '@babel/plugin-syntax-jsx'
import pluginTs from '@babel/plugin-syntax-typescript'
import traverse from '@babel/traverse'
import { ensureDir, pathExists, readFile, remove } from 'fs-extra'
import { join, resolve } from 'path'
import { dirs } from '../dirs'
import { migrateComponent } from './component'

const parseImport = (path: string, root: string) => {
  const arr = path.split('/')
  if (arr[0] === 'web-crud') {
    return resolve(join(root, 'pkgs', 'web', 'crud', ...arr.slice(1)) + '.tsx')
  }
  return resolve(root, 'app', 'web', 'src', path + '.tsx')
}

export const migrateOldExt = async (oldPath: string, root: string) => {
  const result = {} as Record<string, string>
  try {
    traverse(
      parse(await readFile(oldPath, 'utf-8'), {
        sourceType: 'module',
        plugins: [pluginJsx, [pluginTs, { isTSX: true }]],
      }),
      {
        enter: (path) => {
          const c = path.node
          if (
            c.type === 'ExportDefaultDeclaration' &&
            c.declaration.type === 'ObjectExpression'
          ) {
            for (let comp of c.declaration.properties) {
              if (
                comp.type === 'ObjectProperty' &&
                comp.key.type === 'Identifier'
              ) {
                const name = comp.key.name
                if (
                  comp.value.type === 'ArrowFunctionExpression' &&
                  comp.value.body.type === 'ArrayExpression'
                ) {
                  const body = comp.value.body.elements[0]
                  if (
                    body &&
                    body.type === 'CallExpression' &&
                    body.arguments.length > 0 &&
                    body.arguments[0].type === 'StringLiteral'
                  ) {
                    result[name] = body.arguments[0].value
                  }
                }
              }
            }
          }
        },
      }
    )

    const mpath = join(dirs.app.web, 'src', 'migrate')
    if (await pathExists(mpath)) {
      await remove(mpath)
      await ensureDir(mpath)
    }

    for (let [name, path] of Object.entries(result)) {
      const rpath = parseImport(path, root)
      result[name] = removeExtName(
        join('src', 'migrate', rpath.substring(root.length)).replace(/\\/, '/')
      )

      if (!(await migrateComponent(rpath, { root }))) {
        break
      }
    }
  } catch (e) {}
  return result
}

const removeExtName = (src: string) => {
  const arr = src.split('.')
  arr.pop()
  return arr.join('.')
}
