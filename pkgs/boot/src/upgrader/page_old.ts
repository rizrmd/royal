import { parse } from '@babel/core'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { readdir, readFile, readJson, writeFile } from 'fs-extra'
import { join } from 'path'
import { dirs } from '../dirs'
import pluginJsx from '@babel/plugin-syntax-jsx'
import pluginTs from '@babel/plugin-syntax-typescript'
import { format } from 'prettier'

export const convertOldPage = async (oldPath: string) => {
  const pages = {} as Record<
    string,
    {
      name: string
      json: any
      base: { meta: string; init: string; jsx: string }
    }
  >
  console.log('Reading all old pages...')
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
        traverse(
          parse(src, {
            sourceType: 'module',
            plugins: [pluginJsx, [pluginTs, { isTSX: true }]],
          }),
          {
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

                  if (func.type === 'ObjectProperty') {
                  }
                }
              }
            },
          }
        )
        pages[id].base = base
      } catch (e) {
        console.log(`Error while parsing: ${p}`, e)
        break
      }
    }
  }

  for (let [_, p] of Object.entries(pages)) {
    const url = p.json.url

    try {
      const src = format(
        `\
import { page } from 'web-init'
import { useLocal } from 'web-utils'

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

      await writeFile(
        join(dirs.app.web, 'src', 'base', 'page', 'old', `${p.name}.tsx`),
        src
      )
    } catch (e) {
      console.log(`Failed to convert old page: ${_}.json`)
    }
  }
}
