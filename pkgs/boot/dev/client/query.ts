import { readAsync, writeAsync } from 'fs-jetpack'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { format } from 'prettier'
import { dev, walkDir } from './util'

let timeout = null as any
export const reloadQuery = function (
  this: { cwd: string },
  event: string,
  path: string
) {
  clearTimeout(timeout)
  timeout = setTimeout(async () => {
    await generateQueryIndex(this.cwd)
    if (dev.boot) {
      dev.boot.send({ action: 'reload.query' })
    }
  }, 200)
}

const generateQueryIndex = async (cwd: string) => {
  const queryPath = join(cwd, 'app', 'server', 'src', 'query')
  const queryOut = join(cwd, 'app', 'server', 'src', 'query.ts')
  const newQuery: Record<string, { import: string; name: string }> = {}
  const list = await walkDir(join(cwd, 'app', 'server', 'src', 'query'))

  for (let i of list) {
    const name = i
      .substring(0, i.length - 3)
      .substring(queryPath.length + 1)
      .replace(/[\W_]/g, '_')

    const querySrc = await readAsync(i)
    if ((querySrc && !querySrc.trim()) || !querySrc) {
      await writeAsync(
        i,
        `\
import { APIQuery } from 'server-web'

export default (async ({ req }) => {
  return await db.$queryRaw\`SELECT NOW ()\`
}) as APIQuery
      `
      )
    }
    newQuery[name] = {
      import: `./query${i
        .substring(queryPath.length, i.length - 3)
        .replace(/\\\\/gi, '/')}`,
      name,
    }
  }
  const output = `
  ${Object.entries(newQuery)
    .map((arg: any) => {
      const [_, value] = arg
      return `import ${value.name} from '${value.import}'`
    })
    .join('\n')}
  
  export default {
    ${Object.entries(newQuery)
      .map((arg: any) => {
        const [key, value] = arg
        return `'${key}':${value.name},`
      })
      .join('\n')}
      }`
  const formatted = format(output, { parser: 'babel' })
  await writeFile(queryOut, formatted)
}
