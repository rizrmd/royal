import { IFormLayout, IFormSchema } from '../types'

export const prepareLayout = (
  schema: IFormSchema,
  layout?: IFormLayout
): IFormLayout => {
  if (!layout) {
    const nlayout: IFormLayout = []

    for (let k of Object.keys(schema.fields)) {
      if (!k.startsWith('id') && !k.startsWith('_')) {
        nlayout.push(k)
      }
    }
    return nlayout
  }

  return layout
}
