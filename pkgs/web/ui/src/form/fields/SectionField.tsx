/** @jsx jsx */
import { FC, useContext, Fragment } from 'react'
import { IBaseField } from '../types'

interface IUnknownField extends IBaseField {}
export const SectionField: FC<IUnknownField> = ({ ctx, field }) => {
  const cx = useContext(ctx)

  return (
    <Fragment>
      <label class="label">
        <span class="label-text">{field.label}</span>
      </label>
    </Fragment>
  )
}
