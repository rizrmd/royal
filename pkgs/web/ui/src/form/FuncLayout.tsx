/** @jsx jsx */
import { FC, Fragment, ReactElement, useContext } from 'react'
import { IBaseField, IFuncLayout } from './types'

export const FuncLayout: FC<IFuncLayout> = ({ ctx, func, schema }) => {
  const cx = useContext(ctx)
  return (
    <Fragment>
      {func(cx, () => {
        return <Fragment></Fragment>
      })}
    </Fragment>
  )
}
