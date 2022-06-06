/** @jsx jsx */
import { FC, useContext, Fragment } from 'react'
import { IBaseField } from '../types'

interface ICheckbox extends IBaseField {}
export const Checkbox: FC<ICheckbox> = ({ ctx, field }) => {
  if (!field.name || !field.type) return null

  const cx = useContext(ctx)
  const fieldName = field.name
  const value = cx.data[fieldName] || ''

  let type = 'text'
  if (field.type === 'password') type = 'password'

  return (
    <Fragment>
      <label class="label">
        <span class="label-text">{field.label}</span>
      </label>
      <div class="relative">
        {field.prefix}

        <input
          type={type}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => {
            if (field.onChange) {
              field.onChange(e.target.value, cx)
            } else {
              cx.data[fieldName] = e.target.value
              cx.render()
            }
          }}
          class="field-body"
        />

        {field.suffix}
      </div>
    </Fragment>
  )
}
