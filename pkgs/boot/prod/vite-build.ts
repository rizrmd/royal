import { readAsync, removeAsync, writeAsync } from 'fs-jetpack'
import trim from 'lodash.trim'
import { join } from 'path'
import { BaseClient, parseConfig, ParsedConfig } from '../dev/config-parse'
import { pnpm } from '../dev/pnpm-runner'
import cfg from '../../../config'
const cwd = process.cwd()

export const prodBuild = async () => {
  const config = parseConfig(cfg, 'dev')

  await removeAsync(join(cwd, '.output', 'client'))
  for (let [name, client] of Object.entries(config.client)) {
    await prodBuildSingleClient(name, client, config)
  }
}

const prodBuildSingleClient = async (
  name: string,
  client: BaseClient,
  config: ParsedConfig
) => {
  const outDir = join(cwd, '.output', 'client', name)

  await pnpm(['vite', 'build', '--outDir', outDir], {
    name,
    cwd: join(cwd, 'app', name),
    stdout: false,
  })

  const index = await readAsync(join(outDir, 'index.html'))
  const url = client.url.replace(`[server.url]`, config.server.url)

  if (index) {
    const bodyIdx = index.lastIndexOf('</body>')
    await writeAsync(
      join(outDir, 'index.html'),
      index.substring(0, bodyIdx) +
        `
    <script>
      window.baseurl = "${trim(url, '/')}";
      window.serverurl = "${trim(config.server.url, '/')}";
    </script>
  ` +
        index.substring(bodyIdx)
    )
  }
}
