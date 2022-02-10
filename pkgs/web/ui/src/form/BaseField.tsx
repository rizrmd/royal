/** @jsx jsx */
import { FC, useContext } from 'react'
import { IBaseField, IField } from './types'
import { TextField } from './fields/TextField'
import { UnknownField } from './fields/UnknownField'
import { SectionField } from './fields/SectionField'

export const BaseField: FC<IBaseField> = ({ field, ctx: rawContext }) => {
  const ctx = useContext(rawContext)
  if (!field.name || !field.type) return null
  const fieldName = field.name
  const value = ctx.data[field.name]

  const FieldDefinition = {
    text: TextField,
    string: TextField,
    password: TextField,
    number: TextField,
    unknown: UnknownField,
    section: SectionField,
  } as Record<Exclude<IField['type'], undefined>, FC<any>>

  let Field = FieldDefinition[field.type]

  if (!Field) {
    Field = FieldDefinition['unknown']
  }

  return (
    <div className={`field ${field.type} ${field.name}`}>
      <Field field={field} ctx={rawContext} />
    </div>
  )
}
