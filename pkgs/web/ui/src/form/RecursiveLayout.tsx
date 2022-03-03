/** @jsx jsx */
import { FC, Fragment, isValidElement, ReactElement } from 'react'
import { BaseField } from './BaseField'
import { FuncLayout } from './FuncLayout'
import { IField, IRecursiveLayout } from './types'
import { prepareField } from './utils/prepare-field'
import { prepareLayout } from './utils/prep-layout'
import { useContext } from 'react'

export const RecursiveLayout: FC<IRecursiveLayout> = ({
  layout,
  direction,
  schema,
  ctx: rawContext,
}) => {
  const ctx = useContext(rawContext)
  const childs: ReactElement[] = []
  for (let s of layout) {
    let f = s
    if (!f) continue

    if (typeof f === 'object' && !Array.isArray(f) && !isValidElement(f)) {
      const field = f as IField
      if (field.name) {
        if (!schema.fields[field.name]) {
          schema.fields[field.name] = f
          if (f.defaultValue) {
            ctx.data[field.name] = f.defaultValue
          }
        }
        f = field.name
      }
    }

    if (typeof f === 'string') {
      if (f === '...') {
        const expandLayout = prepareLayout(schema)
        childs.push(
          <RecursiveLayout
            ctx={rawContext}
            layout={expandLayout}
            schema={schema}
            direction={direction}
          />
        )
        continue
      }

      let colName = f
      let overrideLabel = ''
      if (!f.startsWith('::') && f.indexOf(':') > 0) {
        colName = f.split(':').shift() || ''
        overrideLabel = f.split(':').pop() || ''
      }

      if (!schema.fields[colName]) {
        schema.fields[colName] = {}
      }

      let field = schema.fields[colName]
      field = prepareField(colName, schema, field)

      if (field) {
        if (overrideLabel) field.label = overrideLabel
        childs.push(<BaseField field={field} ctx={rawContext} />)
      }
    } else if (isValidElement(f)) {
      childs.push(f)
    } else if (Array.isArray(f)) {
      childs.push(
        <RecursiveLayout
          ctx={rawContext}
          layout={f}
          schema={schema}
          direction={direction === 'row' ? 'col' : 'row'}
        />
      )
    } else if (typeof f === 'function') {
      childs.push(<FuncLayout func={f} schema={schema} ctx={rawContext} />)
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
