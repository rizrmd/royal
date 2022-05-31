import { watch } from 'chokidar'
import { build } from 'esbuild'
import throttle from 'lodash.throttle'
import { log } from 'server-utility'

export const buildWatch = async (arg: {
  input: string
  output: string
  buildOptions?: Parameters<typeof build>[0]
  onReady?: (path: string) => void
}) => {
  const builder = {
    watch: null as null | ReturnType<typeof watch>,
    result: null as null | Awaited<ReturnType<typeof build>>,
    debounce: 0 as any,
    building: false,
  }

  const newBuild = async () => {
    try {
      builder.result = await build({
        entryPoints: [arg.input],
        outfile: arg.output,
        external: ['esbuild'],
        bundle: true,
        platform: 'node',
        incremental: true,
        metafile: true,
        watch: {
          onRebuild: (e, buildResult) => {
            if (buildResult) {
              builder.result = buildResult as any
            }
          },
        },
        ...arg.buildOptions,
      })
    } catch (e) {}
  }
  await newBuild()

  const rebuild = throttle(async () => {
    if (builder.building) {
      log('Still building')
      return
    }

    builder.building = true
    let res = builder.result

    if (res) {
      if (!res.rebuild) {
        await newBuild()
        res = builder.result
      }

      if (res && res.rebuild) {
        if (res.stop) res.stop()
        try {
          await res.rebuild()
        } catch (e) {}

        if (builder.watch && builder.result && builder.result.metafile) {
          builder.watch.add(
            getWatchFiles(Object.keys(builder.result.metafile.inputs))
          )
        }

        if (arg.onReady) arg.onReady(arg.output)
      }
    }
    builder.building = false
  }, 500)

  const rewatch = async () => {
    if (builder.result) {
      const meta = builder.result.metafile
      if (meta) {
        builder.watch = watch(getWatchFiles(Object.keys(meta.inputs)), {
          ignoreInitial: true,
        }).on('all', async (event, path) => {
          rebuild()
        })
      }
    }
  }

  await rewatch()
  if (arg.onReady) arg.onReady(arg.output)
}

const getWatchFiles = (inputs: string[]) => {
  return inputs.filter((e) => {
    if (e.startsWith('node_modules')) return false
    return true
  })
}
