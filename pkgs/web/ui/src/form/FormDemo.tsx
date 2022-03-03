import { Form } from './Form'

export const FormDemo = () => {
  return (
    <div
      className="flex flex-1 flex-col"
      css={css`
        .form .field {
          background: red;
          padding: 0px !important;
        }
      `}
    >
      custom
      <Form layout={[{ name: 'jadi', defaultValue: 'halo sodara' }]} />
    </div>
  )
}
