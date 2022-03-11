import { parse } from '@babel/core'
import pluginJsx from '@babel/plugin-syntax-jsx'
import pluginTs from '@babel/plugin-syntax-typescript'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { ensureDir, pathExists, readFile } from 'fs-extra'
import { dirname, join, resolve } from 'path'
import { dirs } from '../dirs'
import { format } from 'prettier'
import { writeFile } from 'fs-extra'
import ts from 'typescript'
import { ServiceHost } from './service-host'

export const migrateComponent = async (
  path: string,
  args: {
    root: string
  }
) => {
  let success = true
  const mpath = join(dirs.app.web, 'src', 'migrate')
  const rpath = path.substring(args.root.length)
  const tpath = join(mpath, rpath)

  await ensureDir(dirname(tpath))

  try {
    let raw = await readFile(path, 'utf-8')
    if (raw.startsWith('/** @jsx jsx */')) {
      raw = raw.substring('/** @jsx jsx */'.length)
    }

    const languageService = ts.createLanguageService(new ServiceHost(path, raw))

    const fileChanges = languageService.organizeImports(
      { type: 'file', fileName: path },
      {},
      {}
    )[0]

    const source = fileChanges
      ? applyTextChanges(raw, fileChanges.textChanges)
      : raw

    const parsed = parse(source, {
      sourceType: 'module',
      plugins: [pluginJsx, [pluginTs, { isTSX: true }]],
    })

    const referencing = [] as string[]
    if (parsed) {
      traverse(parsed, {
        enter: (p) => {
          const c = p.node
          if (
            c.type === 'ImportDeclaration' ||
            c.type === 'ExportAllDeclaration' ||
            c.type === 'ExportNamedDeclaration'
          ) {
            if (c.source && c.source.type === 'StringLiteral') {
              const from = c.source.value
              if (from.startsWith('web-')) {
                const arr = from.split('/')

                if (arr[0] === 'web-app') {
                  arr[0] = 'app/web'
                } else {
                  arr[0] = `pkgs/${arr[0].replace('-', '/')}`
                }

                if (from === 'web-init/src/window') {
                  return
                }

                const absPath = resolve(join(args.root, arr.join('/')))
                let rpath = 'src/migrate/' + arr.join('/')

                referencing.push(absPath)

                c.source.extra = {
                  rawValue: `'${rpath}'`,
                  raw: "'" + rpath + "'",
                }
                c.source.value = rpath
              }

              if (from === 'libs') {
                let rpath = 'web-utils'

                c.source.extra = {
                  rawValue: `'${rpath}'`,
                  raw: "'" + rpath + "'",
                }
                c.source.value = rpath
              }

              if (from.startsWith('.')) {
                const absPath = resolve(join(dirname(path), from))

                let rpath = join(
                  'src',
                  'migrate',
                  absPath.substring(args.root.length)
                ).replace(/\\/, '/')

                if (
                  absPath ===
                  join(args.root, 'pkgs', 'web', 'init', 'src', 'window')
                ) {
                  rpath = 'web-init/src/window'
                } else {
                  referencing.push(absPath)
                }

                c.source.extra = {
                  rawValue: `'${rpath}'`,
                  raw: "'" + rpath + "'",
                }
                c.source.value = rpath
              }
            }
          }
        },
      })

      const source = generate(parsed).code

      const formatted = format(source, {
        parser: 'typescript',
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: true,
      })

      await writeFile(tpath, formatted)
      console.log(`migrated: ${join('src', 'migrate', rpath)}`)

      for (let absPath of referencing) {
        let npath = absPath + '.tsx'
        if (!(await pathExists(npath))) {
          npath = absPath + '.d.ts'
        }

        if (!(await pathExists(npath))) {
          npath = absPath + '.ts'
        }

        if (!(await pathExists(npath))) {
          npath = join(absPath, 'index.tsx')
        }

        if (!(await pathExists(npath))) {
          npath = join(absPath, 'index.ts')
        }

        if (!(await pathExists(npath))) {
          console.log('Failed to migrate ' + absPath)
          continue
        }

        if (await pathExists(join(mpath, npath.substring(args.root.length))))
          continue

        if (npath.indexOf('window') >= 0) {
          console.log(`\n\n${npath}\n${path}\n\n`)
        }
        await migrateComponent(npath, args)
      }
    }
  } catch (e) {
    console.log(`Failed to migrate ${path}\n`, e)
  }
  return success
}

export const applyTextChanges = (input: string, changes: any) =>
  changes.reduceRight((text: any, change: any) => {
    const head = text.slice(0, change.span.start)
    const tail = text.slice(change.span.start + change.span.length)

    return `${head}${change.newText}${tail}`
  }, input)
