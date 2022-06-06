/** @jsx jsx */
import { createContext, FC, useEffect } from 'react'
import { useLocal } from 'web-utils'
import { RecursiveLayout } from './RecursiveLayout'
import { IFormLayout, IFormProps, IFormSchema } from './types'
import { prepareLayout } from './utils/prep-layout'
import { prepareSchemaFromDb } from './utils/prep-schema'

export const Form: FC<IFormProps> = ({
  schema,
  layout,
  className,
  defaultValue,
  onSubmit,
  css,
  init,
}) => {
  const local = useLocal(
    {
      ready: false,
      schema: { ...schema } as unknown as IFormSchema,
      layout: { ...layout } as unknown as IFormLayout,
      data: (defaultValue || {}) as any,
      error: {} as any,
      ctx: createContext({} as any),
    },
    async () => {
      if (schema?.tableName) {
        local.schema = await prepareSchemaFromDb(schema)
      }

      if (!local.schema.fields) {
        local.schema.fields = {}
      }

      local.layout = prepareLayout(local.schema, layout)

      for (let field of Object.values(local.schema.fields)) {
        if (field.defaultValue && field.name) {
          local.data[field.name] = field.defaultValue
        }
      }

      local.ready = true
      local.render()

      if (init) {
        init(dataContext)
      }
    }
  )

  const dataContext = {
    data: local.data,
    error: local.error,
    render: local.render,
  } as any

  dataContext.submit = () => {
    // lakukan validasi dulu
    if (onSubmit) onSubmit(dataContext)
  }

  if (!local.ready) return null
  const Context = local.ctx

  return (
    <form
      className={`form${className ? ' ' + className : ''}`}
      onSubmit={(e) => {
        e.preventDefault()
        if (onSubmit) onSubmit(dataContext)
      }}
    >
      <Context.Provider value={dataContext}>
        <RecursiveLayout
          direction="col"
          layout={local.layout}
          schema={local.schema}
          ctx={local.ctx}
        />
      </Context.Provider>
    </form>
  )
}
