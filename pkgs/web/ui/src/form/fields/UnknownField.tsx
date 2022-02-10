/** @jsx jsx */
import { FC, useContext, Fragment } from 'react'
import { IBaseField } from '../types'

interface IUnknownField extends IBaseField {}
export const UnknownField: FC<IUnknownField> = ({ ctx, field }) => {
  const cx = useContext(ctx)

  return (
    <Fragment>
      <label class="label">
        <span class="label-text">{field.label}</span>
      </label>
      <div class="relative">
        {field.prefix}
        <div className="field-body">
          {typeof field.render === 'function'
            ? field.render({ ctx: cx, field })
            : null}
          <div></div>
        </div>
        {field.suffix}
      </div>
    </Fragment>
  )
}
