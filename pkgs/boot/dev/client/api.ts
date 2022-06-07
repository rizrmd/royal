import { basename } from 'path'
import { clientDir, dev, walkDir } from './util'
import { format } from 'prettier'
import { writeFile } from 'fs/promises'
import { IClientWatchers } from '../build-client'

let timeout = null as any
let firstgen = false
export const reloadAPI = function (
  this: {
    name: string
    build: () => Promise<void>
    watchers: IClientWatchers
    singleRun: boolean
  },
  event: string,
  path: string
) {
  clearTimeout(timeout)
  timeout = setTimeout(async () => {
    await generateApiIndex(this.name)
    await this.build()
    if (dev.boot) {
      dev.boot.send({ action: 'reload.api', name: this.name })
    }
  }, 200)

  if (this.singleRun) {
    clearTimeout(this.watchers.singleRun.api)
    this.watchers.singleRun.api = setTimeout(() => {
      if (this.watchers.api) {
        this.watchers.api.close()
      }
    }, 2000)
  }
}

const generateApiIndex = async (name: string) => {
  const newApi: Record<string, { import: string; name: string }> = {}
  const list = await walkDir(clientDir.api)

  for (let i of list) {
    const name = i
      .substring(0, i.length - 3)
      .substring(clientDir.api.length + 1)
      .replace(/[\W_]/g, '_')

    newApi[name] = {
      import: `..${i
        .substring(clientDir.root.length, i.length - 3)
        .replace(/\\/gi, '/')}`,
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
  await writeFile(clientDir.apiOut, formatted)
}
