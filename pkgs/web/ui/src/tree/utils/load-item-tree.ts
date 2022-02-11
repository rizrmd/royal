import { ITreeSchema } from '../types'

export const loadItemTree = async (
  row: any,
  schema: ITreeSchema,
  childCol: string
) => {
  return await (db as any)[schema.tableName].findMany({
    where: {
      [schema.parentColumn]: row[childCol],
    },
  })
}
