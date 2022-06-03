import { ChildProcess } from 'child_process'
import { watch } from 'chokidar'
import { build } from 'esbuild'

export const buildWatch = async (arg: {
  input: string
  output: string
  buildOptions?: Parameters<typeof build>[0]
  debug?: true
  onReady?: (path: string) => void
}) => {
  await build({
    entryPoints: [arg.input],
    outfile: arg.output,
    external: ['esbuild'],
    bundle: true,
    platform: 'node',
    watch: {
      onRebuild: () => {
        if (arg.onReady) arg.onReady(arg.output)
      },
    },
    metafile: true,
    ...arg.buildOptions,
  })
  if (arg.onReady) arg.onReady(arg.output)
}
