import 'react'
import { Context, FC, ReactElement } from 'react'
import { DBSchema, IRelation } from 'web-utils'
import { dbsList } from '../../../../../app/web/types/dbs-list'
type IField = {
  defaultValue?: any
  required?: boolean
  name?: string
  label?: string
  placeholder?: string
  description?: string
  prefix?: string | ReactElement
  suffix?: string | ReactElement
  onChange?: (newValue: any, ctx: DataContainer) => void
  type?:
    | 'number'
    | 'string'
    | 'text'
    | 'password'
    | 'money'
    | 'multiline'
    | 'date'
    | 'checkbox'
    | 'datetime'
    | 'select'
    | 'boolean'
    | 'belongs'
    | 'custom'
    | 'unknown'
    | 'info'
    | 'section'
    | 'decimal'
    | 'file'
  render?: FC<{ ctx: DataContainer; field: IField }>
  info?: IBelongsInfo
}

type IBelongsInfo = { rel: IRelation; fieldType: string }

type IFormSchema = IFormSchemaAbstract<Record<string, IField>>
type IFormSchemaAbstract<K extends Record<string, IField>> = {
  dbConnection?: typeof dbsList[number]
  tableName?: string
  dbInternal?: DBSchema
  fields: K
  allFields?: boolean
  onSubmit?: (data: Record<keyof K, any>) => void | Promise<void>
}

type IFormProps = {
  schema?: Partial<IFormSchema>
  defaultValue?: any
  className?: string
  css?: any
  onSubmit?: (ctx: DataContainer) => void
  init?: (ctx: DataContainer) => void | Promise<void>
  layout?: IFormLayout
}

type IFormLayout = (
  | string
  | ReactElement
  | ((
      ctx: DataContainer,
      layout: (layout: any) => React.ReactElement
    ) => React.ReactElement)
  | IFormLayout
  | (IField & { name: string })
)[]

type DataContainer = {
  data: Record<string, any>
  error: Record<string, string>
  render: () => void
  submit: () => void
}
type DataContext = Context<DataContainer>
type IRecursiveLayout = {
  schema: IFormSchema
  layout: IFormLayout
  direction: 'row' | 'col'
  ctx: DataContext
}

type IBaseField = {
  field: IField
  ctx: DataContext
}

type IFuncLayout = {
  schema: IFormSchema
  ctx: DataContext
  func: (
    ctx: DataContainer,
    layout: (layout: IFormLayout) => ReactElement
  ) => ReactElement
}
