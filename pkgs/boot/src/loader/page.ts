import { writeFile } from 'fs-extra'
import { join } from 'path'
import { dirs } from '..'
import { walkDir } from '../utils'
import PrettyError from 'pretty-error'

export const pagePath = {
  out: join(dirs.app.web, 'types', 'page.ts'),
  dir: join(dirs.app.web, 'src', 'base', 'page'),
}

export const pageOutput = {
  list: {} as any,
}
export const generatePage = async () => {
  const list = await walkDir(pagePath.dir)
  pageOutput.list = {}

  for (let path of list) {
    try {
      let pathNoExt = path.endsWith('.tsx')
        ? path.substring(0, path.length - 4)
        : path

      const name = pathNoExt
        .substring(join(dirs.app.web, 'src', 'base', 'page').length + 1)
        .replace(/[\/\\]/gi, '.')

      delete require.cache[path]
      const result = require(path)
      const page = result.default
      const layout = page.layout || 'default'
      pageOutput.list[name] = `["${
        page.url
      }", "${layout}", () => import('..${path
        .substring(dirs.app.web.length, path.length - 4)
        .replace(/\\/gi, '/')}')]`
    } catch (e) {}
  }

  const output = `export default {
  ${Object.entries(pageOutput.list)
    .map((arg: any) => {
      const [key, value] = arg
      return `'${key}':${value},`
    })
    .join('\n  ')}
}`
  await writeFile(pagePath.out, output)
}

export const generatePageSingle = async (path: string) => {
  delete require.cache[path]
  try {
    const result = require(path)

    let pathNoExt = path.endsWith('.tsx')
      ? path.substring(0, path.length - 4)
      : path

    const name = pathNoExt
      .substring(join(dirs.app.web, 'src', 'base', 'page').length + 1)
      .replace(/[\/\\]/gi, '.')

    const page = result.default
    const layout = page.layout || 'default'
    const expected = `["${page.url}", "${layout}", () => import('..${path
      .substring(dirs.app.web.length, path.length - 4)
      .replace(/\\/gi, '/')}')]`

    if (expected !== pageOutput.list[name]) {
      pageOutput.list[name] = expected

      const output = `export default {
  ${Object.entries(pageOutput.list)
    .map((arg: any) => {
      const [key, value] = arg
      return `'${key}':${value},`
    })
    .join('\n  ')}
}`

      await writeFile(pagePath.out, output)
    }
  } catch (e: any) {
    var pe = new PrettyError()
    console.log(
      `Error while saving \n${path.substring(
        dirs.root.length + 1
      )}:\n\n${pe.render(e)} `
    )
  }
}
