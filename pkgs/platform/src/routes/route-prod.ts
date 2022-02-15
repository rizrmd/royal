import { dirs } from 'boot'
import { FastifyInstance, FastifyReply } from 'fastify'
import { pathExists, readFile } from 'fs-extra'
import mime from 'mime-types'
import { join, resolve } from 'path'
import { detectContentType } from './content-type'

export const routeProd = async (server: FastifyInstance) => {
  const indexHtmlPath = join(dirs.app.web, 'build', 'index.html')
  if (await pathExists(indexHtmlPath)) {
    const files = {
      '/': await readFile(indexHtmlPath),
    }

    const sendFile = (url: string, reply: FastifyReply) => {
      const type = mime.lookup(url)
      if (type) {
        reply.type(type)
      } else {
        reply.type(detectContentType(files[url]))
      }
      reply.send(files[url])
    }

    server.get('*', async (req, reply) => {
      const url = resolve(join(dirs.app.web, 'build'), req.url)
      if (!files[url]) {
        const filePath = join(dirs.app.web, 'build', url)
        if (await pathExists(filePath)) {
          files[url] = await readFile(filePath)
        }
      }

      if (files[url]) {
        sendFile(url, reply)
      } else {
        sendFile('/', reply)
      }
    })
  }
}
