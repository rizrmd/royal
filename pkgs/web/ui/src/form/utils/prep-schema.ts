import { IField, IFormSchema } from '../types'
import { getSchema } from 'web-utils'
import { niceCase } from './nice-case'
export const prepareSchemaFromDb = async (
  schema: Partial<IFormSchema>
): Promise<IFormSchema> => {
  if (!schema.tableName) return schema as any

  let dbInternal = undefined
  try {
    dbInternal = await getSchema(schema.dbConnection || 'db', schema.tableName)
  } catch (e) {
    console.log(e)
  }

  const fields = { ...schema.fields } as Record<string, IField>

  if (dbInternal) {
    if (
      Object.keys(schema.fields || {}).length === 0 ||
      schema.allFields !== false
    ) {
      for (let colName of Object.keys(dbInternal.columns)) {
        if (!fields[colName]) fields[colName] = {}
      }
    }
  }

  for (let [k, v] of Object.entries(fields || {})) {
    const field = { ...v }
    const col = dbInternal ? dbInternal.columns[k] : null

    if (!field.name) field.name = k
    if (!field.label) field.label = niceCase(k)

    if (col) {
      if (!field.type) field.type = col.type as any

      const rel = dbInternal?.relations[k]
      if (rel) {
        if (rel.type === 'belongs-to') {
          field.type = 'belongs'
          field.info = { rel, fieldType: col.type }
        }
      }

      if (typeof field.required === 'undefined') {
        field.required = !col.nullable
      }
    }
    fields[k] = field
  }

  return {
    dbInternal: dbInternal,
    fields,
  }
}
