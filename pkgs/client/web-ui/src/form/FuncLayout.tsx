/** @jsx jsx */
import { FC, Fragment, ReactElement, useContext } from 'react'
import { RecursiveLayout } from './RecursiveLayout'
import { IBaseField, IFuncLayout } from './types'

export const FuncLayout: FC<IFuncLayout> = ({ ctx, func, schema }) => {
  const cx = useContext(ctx)
  return (
    <Fragment>
      {func(cx, (layout) => {
        return (
          <RecursiveLayout
            ctx={ctx}
            schema={schema}
            layout={layout}
            direction={'row'}
          />
        )
      })}
    </Fragment>
  )
}
