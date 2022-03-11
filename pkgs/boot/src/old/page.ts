import { parse } from '@babel/core'
import generate from '@babel/generator'
import pluginJsx from '@babel/plugin-syntax-jsx'
import pluginTs from '@babel/plugin-syntax-typescript'
import traverse from '@babel/traverse'
import { ensureDir, readdir, readFile, readJson, writeFile } from 'fs-extra'
import { join } from 'path'
import { format } from 'prettier'
import ts from 'typescript'
import { dirs } from '../dirs'
import { applyTextChanges } from './component'
import { ServiceHost } from './service-host'

export const migrateOldPage = async (
  oldPath: string,
  ext: Record<string, string>
) => {
  const pages = {} as Record<
    string,
    {
      name: string
      json: any
      base: { meta: string; init: string; jsx: string }
    }
  >
  console.log('Reading all old pages...')
  const imports = {} as Record<string, string>
  for (let p of await readdir(oldPath)) {
    const id = p.substring(0, 5)

    if (!parseInt(id)) {
      continue
    }

    if (!pages[id]) {
      pages[id] = { name: '', json: {}, base: { meta: '', init: '', jsx: '' } }
    }

    if (p.endsWith('.json')) {
      pages[id].json = await readJson(join(oldPath, p))
    } else {
      pages[id].name = p.split('.')[0].substring(6)
      const src = await readFile(join(oldPath, p), 'utf8')

      const base = {
        meta: '',
        init: '',
        jsx: '',
      }
      try {
        const parsed = parse(src, {
          sourceType: 'module',
          plugins: [pluginJsx, [pluginTs, { isTSX: true }]],
        })
        traverse(parsed, {
          enter: (path) => {
            const c = path.node
            if (c.type.toLowerCase().indexOf('jsx') >= 0) {
              if (
                c.type === 'JSXOpeningElement' ||
                c.type === 'JSXClosingElement'
              ) {
                if (c.name.type === 'JSXIdentifier') {
                  if (ext[c.name.name]) {
                    const oldName = c.name.name
                    c.name.name =
                      c.name.name[0].toUpperCase() + c.name.name.substring(1)

                    imports[c.name.name] = ext[oldName]
                  }
                }
              }
            }
          },
        })
        traverse(parsed, {
          enter: (path) => {
            const c = path.node
            if (
              c.type === 'CallExpression' &&
              c.callee.type === 'Identifier' &&
              c.callee.name === 'base'
            ) {
              const jsx = c.arguments[1]
              if (jsx.type === 'ArrowFunctionExpression') {
                base.jsx = generate(jsx.body).code
              }

              const arg = c.arguments[0]
              if (arg.type === 'ObjectExpression') {
                for (let f of arg.properties) {
                  if (
                    f.type === 'ObjectProperty' &&
                    f.key.type === 'Identifier'
                  ) {
                    if (f.key.name === 'init') {
                      if (f.value.type === 'ArrowFunctionExpression') {
                        f.value.params = []
                      }
                      base.init = generate(f.value).code
                    } else {
                      if (f.key.name === 'meta') {
                        base.meta = generate(f.value).code
                      }
                    }
                  }
                }
                const func = arg.properties[0]
              }
            }
          },
        })
        pages[id].base = base
      } catch (e) {
        console.log(`Error while parsing: ${p}`, e)
        break
      }
    }
  }
  await ensureDir(join(dirs.app.web, 'src', 'base', 'page', 'migrate'))

  for (let [_, p] of Object.entries(pages)) {
    const url = p.json.url

    try {
      const src = format(
        `\
import { page } from 'web-init'
import { useLocal } from 'web-utils'
${Object.entries(imports)
  .map(([name, from]) => {
    return `import ${name} from '${from}'`
  })
  .join('\n')}

export default page({
  url: '${url}',
  component: ({}) => {
    const declare_meta = ${p.base.meta}
    const init_meta = () => {
      return ${p.base.init}
    }
    const meta = useLocal(declare_meta(), init_meta())
    return ${p.base.jsx}
  },
})
`,
        {
          parser: 'typescript',
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          semi: false,
          singleQuote: true,
          trailingComma: 'es5',
          bracketSpacing: true,
        }
      )

      const path = join(
        dirs.app.web,
        'src',
        'base',
        'page',
        'migrate',
        `${p.name}.tsx`
      )

      const languageService = ts.createLanguageService(
        new ServiceHost(path, src)
      )

      const fileChanges = languageService.organizeImports(
        { type: 'file', fileName: path },
        {},
        {}
      )[0]

      const source = fileChanges
        ? applyTextChanges(src, fileChanges.textChanges)
        : src

      await writeFile(path, source)
    } catch (e) {
      console.log(`Failed to convert old page: ${_}.json`)
    }
  }
}
