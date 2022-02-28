/** @jsx jsx */
import { FC, Fragment, isValidElement, ReactElement } from 'react'
import { BaseField } from './BaseField'
import { FuncLayout } from './FuncLayout'
import { IRecursiveLayout } from './types'
import { prepareField } from './utils/prepare-field'
import { prepareLayout } from './utils/prep-layout'

export const RecursiveLayout: FC<IRecursiveLayout> = ({
  layout,
  direction,
  schema,
  ctx,
}) => {
  const childs: ReactElement[] = []
  for (let s of layout) {
    if (!s) continue
    if (typeof s === 'string') {
      if (s === '...') {
        const expandLayout = prepareLayout(schema)
        childs.push(
          <RecursiveLayout
            ctx={ctx}
            layout={expandLayout}
            schema={schema}
            direction={direction}
          />
        )
        continue
      }

      let colName = s
      let overrideLabel = ''
      if (!s.startsWith('::') && s.indexOf(':') > 0) {
        colName = s.split(':').shift() || ''
        overrideLabel = s.split(':').pop() || ''
      }

      let field = schema.fields[colName]
        ? { ...schema.fields[colName] }
        : undefined

      field = prepareField(colName, schema, field)

      if (field) {
        if (overrideLabel) field.label = overrideLabel

        childs.push(<BaseField field={field} ctx={ctx} />)
      }
    } else if (isValidElement(s)) {
      childs.push(s)
    } else if (Array.isArray(s)) {
      childs.push(
        <RecursiveLayout
          ctx={ctx}
          layout={s}
          schema={schema}
          direction={direction === 'row' ? 'col' : 'row'}
        />
      )
    } else if (typeof s === 'function') {
      childs.push(<FuncLayout func={s} schema={schema} ctx={ctx} />)
    }
  }

  return (
    <div
      className={`flex flex-1 items-stretch self-stretch ${
        direction === 'row' ? 'space-x-2' : ''
      } flex-${direction}`}
      css={css`
        ${direction === 'row'
          ? css`
              > div:not(.hidden) {
                display: flex;
                flex: 1;
                > ul {
                  &::after {
                    display: none;
                  }
                }
              }
            `
          : css`
              > div > ul {
                &::after {
                  display: none;
                }
              }

              > div:last-of-type {
                > ul {
                  &::after {
                    display: block;
                  }
                }
              }
            `}
      `}
    >
      {childs.map((el, idx) => {
        return <Fragment key={idx}>{el}</Fragment>
      })}
    </div>
  )
}
