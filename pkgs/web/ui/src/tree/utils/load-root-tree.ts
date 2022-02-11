import { ITreeSchema } from '../types'

export const loadRootTree = async (schema: ITreeSchema) => {
  return await (db as any)[schema.tableName].findMany({
    where: schema.rootCondition,
  })
}
