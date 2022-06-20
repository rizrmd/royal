import { writeFile } from 'fs/promises'
import { join } from 'path'
import { format } from 'prettier'
import { dev, walkDir } from './util'

let timeout = null as any
export const reloadAPI = function (
  this: { cwd: string },
  event: string,
  path: string
) {
  clearTimeout(timeout)
  timeout = setTimeout(async () => {
    await generateApiIndex(this.cwd)
    if (dev.boot) {
      dev.boot.send({ action: 'reload.api' })
    }
  }, 200)
}

const generateApiIndex = async (cwd: string) => {
  const apiPath = join(cwd, 'app', 'server', 'src', 'api')
  const apiOut = join(cwd, 'app', 'server', 'src', 'api.ts')
  const newApi: Record<string, { import: string; name: string }> = {}
  const list = await walkDir(join(cwd, 'app', 'server', 'src', 'api'))

  for (let i of list) {
    const name = i
      .substring(0, i.length - 3)
      .substring(apiPath.length + 1)
      .replace(/[\W_]/g, '_')

    newApi[name] = {
      import: `./api/${i
        .substring(apiPath.length, i.length - 3)
        .replace(/\\\\/gi, '/')}`,
      name,
    }
  }
  const output = `
  ${Object.entries(newApi)
      .map((arg: any) => {
        const [_, value] = arg
        return `import ${value.name} from '${value.import}'`
      })
      .join('\n')}
  
  export default {
    ${Object.entries(newApi)
      .map((arg: any) => {
        const [key, value] = arg
        return `'${key}':${value.name},`
      })
      .join('\n')}
      }`
  const formatted = format(output, { parser: 'babel' })
  await writeFile(apiOut, formatted)
}
