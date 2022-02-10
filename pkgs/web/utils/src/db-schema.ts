type IColumn = {
  name: string
  type: string
  isPrimaryKey: boolean
  nullable: string
}

type IRelation = {
  join: {
    from: string
    to: string
  }
  type: 'has-many' | 'belongs-to'
  relationName: string
}

export type DBSchema = {
  db: string
  table: string
  columns: Record<string, IColumn>
  relations: Record<string, IRelation>
  primaryKey: string
}

export const getSchema = async (
  dbName: string,
  tableName: string
): Promise<DBSchema> => {
  const w = window as any

  const db = w[dbName]
  const res = await db[tableName].definition()

  const columns = {} as Record<string, IColumn>
  const relations = {} as Record<string, IRelation>

  for (let [k, v] of Object.entries(res.columns) as any) {
    columns[k] = {
      isPrimaryKey: v.pk,
      nullable: v.nullable,
      name: v.name,
      type: v.type,
    }
  }

  for (let [k, v] of Object.entries(res.rels) as any) {
    relations[k] = {
      join: v.join,
      relationName: v.modelClass,
      type: v.relation === 'Model.HasManyRelation' ? 'has-many' : 'belongs-to',
    }
  }

  return {
    db: dbName,
    table: tableName,
    columns,
    relations,
    primaryKey: res.pk,
  }
}
