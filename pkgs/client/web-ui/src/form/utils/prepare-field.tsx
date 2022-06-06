/** @jsx jsx */
import { IField, IFormSchema } from '../types'
import { niceCase } from './nice-case'

export const prepareField = (
  colName: string,
  schema: IFormSchema,
  field?: IField
): IField => {
  if (colName.startsWith('::'))
    return {
      name: colName,
      label: colName.substring(2),
      type: 'section',
    }

  let result = {} as IField
  if (field) {
    result = field
  }

  if (!result.name) result.name = colName
  if (!result.type) result.type = 'text'
  if (!result.label) result.label = niceCase(colName)

  return result
}
