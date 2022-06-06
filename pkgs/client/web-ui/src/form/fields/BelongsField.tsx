/** @jsx jsx */
import { FC, useContext, Fragment } from 'react'
import { useLocal } from 'web-utils'
import { IBaseField } from '../types'

interface IUnknownField extends IBaseField {}
export const BelongsField: FC<IUnknownField> = ({ ctx, field }) => {
  if (!field.name || !field.type) return null

  const cx = useContext(ctx)
  const fieldName = field.name
  const local = useLocal({ list: [], toCol: '', fieldType: '' }, async () => {
    if (field.info) {
      local.fieldType = field.info.fieldType
      const [toTable, toCol] = field.info.rel.join.to.split('.')
      local.toCol = toCol
      local.list = await (db as any)[toTable].findMany()
      local.render()
    }
  })

  return (
    <Fragment>
      <label class="label">
        <span class="label-text">{field.label}</span>
      </label>
      <div class="relative">
        {field.prefix}
        <div className="field-body">
          <select
            value={cx.data[fieldName]}
            onChange={(e) => {
              let value = e.target.value as any
              if (local.fieldType === 'number') {
                value = parseFloat(value)
              }
              if (field.onChange) {
                field.onChange(value || undefined, cx)
              } else {
                cx.data[fieldName] = value || undefined
                cx.render()
              }
            }}
          >
            <option></option>
            {local.list.map((e, idx) => {
              return (
                <option key={idx} value={e[local.toCol]}>
                  {e[getLabel(e)]}
                </option>
              )
            })}
          </select>
        </div>
        {field.suffix}
      </div>
    </Fragment>
  )
}

const getLabel = (row: any) => {
  let firstCol = ''
  let alternative = ''
  let idx = 0
  for (let [k, v] of Object.entries(row)) {
    if (firstCol === '') firstCol = k

    const col = k.toLowerCase()
    if (col.indexOf('name') >= 0 || col.indexOf('nama') >= 0) {
      return k
    }

    if (col.indexOf('id') < 0 && alternative === '') {
      alternative = k
    }
  }
  return alternative || firstCol
}
