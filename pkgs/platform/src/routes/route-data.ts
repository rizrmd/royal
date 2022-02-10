import { dirs, log } from 'boot'
import * as dbs from 'dbs'
import { FastifyReply, FastifyRequest } from 'fastify'
import { join } from 'path'
import zlib from 'zlib'

export const routeData = async (req: FastifyRequest, reply: FastifyReply) => {
  let reqBody = '' as any

  await (req as any).handleSession()

  if (req.body instanceof Buffer) {
    if (req.url === '/__data/query') {
      reqBody = req.body
    } else {
      try {
        reqBody = JSON.parse(req.body.toString('utf-8'))
      } catch (e) {
        console.error('data', 'Failed to parse data query as Json')
        reqBody = {}
      }
    }
  }

  if (req.method === 'POST') {
    const body: {
      action: string
      db: string
      table: string
      params: string
    } = reqBody as any

    const db = dbs[body.db]

    let role = req.session.role || 'guest'
    if (role) {
      try {
        const dbAuth = require(join(
          dirs.app.web,
          `src/auth/roles/${role}/db-auth`
        )).default

        if (!dbAuth(body)) {
          reply.code(403).send('{"status":"forbidden"}')
          return
        }
      } catch (e) {}
    }

    if (!db) {
      reply.code(403).send('{"status":"forbidden"}')
      return
    }

    const dmmfPath = join(
      dirs.app.dbs,
      body.db,
      'node_modules',
      '.prisma',
      'client',
      'index.js'
    )
    const prisma = require(dmmfPath)
    const dmmf = prisma.dmmf

    if (body && body.table) {
      body.table = body.table.toLowerCase().replace(/[\W_]+/g, '_')
    }

    reply.removeHeader('Content-Length')
    reply.removeHeader('Transfer-encoding')

    if (
      !db[body.table] &&
      body.table &&
      body.action !== 'tables' &&
      body.action !== 'typedef' &&
      body.action !== 'reload-schema'
    ) {
      reply.send({
        status: 'failed',
        reason: `Table ${
          body.table
        } not found. Available tables are: \n\n - ${Object.keys(db)
          .filter((e) => {
            return !e.startsWith('_')
          })
          .join('\n - ')}\n\n`,
      })
      return
    }

    let result: any = null
    try {
      switch (body.action) {
        case 'typedef': {
          const models = dmmf.datamodel.models
          const tables: string[] = []
          const result = models
            .map((e) => {
              tables.push("'" + e.name + "'")
              return `\
    ${e.name}: {
    ${e.fields
      .map((f) => {
        if (f.kind === 'object') {
          if (f.isList) {
            return `   ${f.name}: Array<DBDefinitions['${f.type}']>`
          } else {
            return `   ${f.name}: DBDefinitions['${f.type}']`
          }
        }

        return `   ${f.name}: ${convertDBType(f.type)}`
      })
      .join('\n')}
    }`
            })
            .join('\n')
          reply.send(`\
    type DBDefinitions = {
      ${result}
    }
    type DBTables = ${tables.join(' | ')}
    `)
          return
        }
        case 'definition':
          {
            const schema = dmmf.schema.outputObjectTypes.model.find(
              (e) => e.name === body.table
            )
            if (!schema) return
            const model = dmmf.datamodel.models.find(
              (e) => e.name === body.table
            )
            if (!model) return
            const pk = model.fields.filter((e) => e.isId)

            const relations: Record<string, any> = {}
            model.fields
              .filter((e) => e.kind === 'object')
              .map((e) => {
                const s = schema.fields.find((f) => f.name === e.name)

                if (s && s.outputType.namespace === 'model') {
                  if (s.outputType.isList) {
                    const foreign = dmmf.datamodel.models.find((f) => {
                      return f.name === s.outputType.type
                    })

                    if (foreign) {
                      const rel = foreign.fields.find(
                        (f) => f.relationName === e.relationName
                      )
                      if (rel && rel.relationToFields)
                        relations[e.name] = {
                          relation: 'Model.HasManyRelation',
                          modelClass: e.type,
                          join: {
                            from: `${e.type}.${rel.relationToFields[0]}`,
                            to: `${rel.type}.${rel.relationFromFields[0]}`,
                          },
                        }
                    }
                  } else {
                    const foreign = dmmf.datamodel.models.find((f) => {
                      return f.name === s.outputType.type
                    })

                    if (foreign) {
                      const rel = foreign.fields.find(
                        (f) => f.relationName === e.relationName
                      )
                      if (rel && e.relationToFields)
                        relations[e.name] = {
                          relation: 'Model.BelongsToOneRelation',
                          modelClass: e.type,
                          join: {
                            from: `${rel.type}.${e.relationFromFields[0]}`,
                            to: `${e.type}.${e.relationToFields[0]}`,
                          },
                        }
                    }
                  }
                }
                return {}
              })

            const columns = {}
            schema.fields
              .filter((e) => e.outputType.location === 'scalar')
              .map((e) => {
                columns[e.name] = {
                  name: e.name,
                  type: convertDBType(e.outputType.type),
                  pk: pk.length > 0 ? pk[0].name === e.name : false,
                  nullable: e.isNullable,
                }

                for (let f of Object.values(relations)) {
                  if (
                    f.relation === 'Model.BelongsToOneRelation' &&
                    f.join.from === `${body.table}.${e.name}`
                  ) {
                    columns[e.name].rel = f
                  }
                }
              })

            reply.send(
              JSON.stringify({
                db: {
                  name: body.table,
                },
                rels: relations,
                columns: columns,
              })
            )
          }
          return
        case 'tables':
          reply.send(
            JSON.stringify(
              dmmf.schema.outputObjectTypes.model.map((e) => {
                return e.name
              })
            )
          )
          return
        case 'query': {
          // old version query for backward-compatibility
          let params = {}
          if (Array.isArray(body.params)) {
            for (let prms of body.params) {
              if (typeof prms === 'object') {
                params = convertOldQueryParams(body.table, prms, dmmf)
              }
            }
          }

          let final = { func: async (_: any) => {}, db: db }
          new Function(`this.func = this.db.${body.table}.findMany`).bind(
            final
          )()
          const result: any = await final.func(params)

          return compress(req, reply, result)
        }
        default:
          if (body.action === 'upsertMany') {
            const params: Array<any> = body.params[0] as any

            result = await db.$transaction(
              params.map((e) => db[body.table].upsert(e))
            )
          } else {
            let final = { func: async (...v: any[]) => {}, db: db }
            new Function(
              `this.func = this.db.${body.table}.${body.action}`
            ).bind(final)()
            if (final.func) {
              result = await final.func(...body.params)
              return compress(req, reply, result || JSON.stringify(result))
            } else {
              throw new Error(
                `db.${body.table}.${body.action} is not a function.`
              )
            }
          }
          break
      }
      reply.send(JSON.stringify(result))
    } catch (e: any) {
      if (body.action && body.table) {
        log(
          'platform',
          `Failed to ${body.action} on table "${
            body.table
          }" on data-router: ${e.toString()}`
        )
      }
      reply.send(
        JSON.stringify({ ...e, status: 'failed', reason: e.toString() })
      )
    }
    // reply.send(JSON.stringify(reqBody, null, 2))
    return
  }

  reply.code(403).send('Forbidden')
}

const convertDBType = (type: any) => {
  switch (type) {
    case 'Int':
    case 'BigInt':
    case 'Float':
    case 'Decimal':
      return 'number'
    case 'Boolean':
      return 'boolean'
    case 'String':
      return 'string'
    case 'Date':
    case 'date':
      return 'date'
    case 'DateTime':
      return 'date'
    case 'Json':
      return 'object'
  }

  console.log(`Failed to convert DB Type: ${type} `)
  return ''
}

export const convertOldQueryParams = (tableName: string, prms: any, dmmf) => {
  const params = {}
  for (let [k, v] of Object.entries(prms)) {
    if (k === 'where') {
      if (typeof v === 'function') {
        throw new Error(
          'Please convert old where function to prisma where object:\n' +
            v.toString()
        )
      } else {
        params[k] = v
      }
    }
    if (k === 'select' && typeof v === 'object' && v) {
      const select = {}

      const rels: any = {}
      const model = dmmf.datamodel.models.find((e) => e.name === tableName)
      if (model) {
        for (let i of model?.fields) {
          if (i.relationName) {
            rels[i.type.toString()] = true
          }
        }
      }

      for (let [selkey, selval] of Object.entries(v)) {
        if (rels[selkey]) {
          select[selkey] = {
            select: selval,
          }
        } else {
          select[selkey] = selval
        }
      }
      params[k] = select
    }
    if (k === 'order') {
      if (Array.isArray(v)) {
        const order = v[0] as any
        params['orderBy'] = {
          [order['column']]: order['order'].toLowerCase(),
        }
      }
    }
  }
  return params
}

const compress = (req: FastifyRequest, reply: FastifyReply, content: any) => {
  // compress when more than 1MB
  if (Buffer.byteLength(content + '\n', 'utf8') > 1000 * 1024) {
    const accept = req.headers['accept-encoding'] || ''
    if (accept.indexOf('br') >= 0) {
      zlib.brotliCompress(content, {}, (_, result) => {
        reply.header('content-encoding', 'br')
        reply.send(result)
      })
      return
    }
    if (accept.indexOf('gz') >= 0) {
      reply.header('content-encoding', 'gzip')
      zlib.gzip(content, {}, (_, result) => {
        reply.send(result)
      })
      return
    }
    if (accept.indexOf('deflate') >= 0) {
      reply.header('content-encoding', 'deflate')
      zlib.deflate(content, {}, (_, result) => {
        reply.send(result)
      })
      return
    }
  }

  reply.send(content)
}
