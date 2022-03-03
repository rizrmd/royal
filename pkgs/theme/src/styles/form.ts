export default (inputCSS: any) => css`
  &.form {
    .field {
      display: flex;
      flex-direction: column;
      padding: 10px;

      .label {
        padding: 0px 0px 10px 0px;
      }

      .field-body {
        font-size: 1rem;
        line-height: 1.5rem;
        min-height: 2.75rem;
        width: 100%;
        display: flex;
        border-radius: 0px;
        padding-top: 0.5rem;
        padding-right: 0.75rem;
        padding-bottom: 0.5rem;
        padding-left: 0.75rem;
        flex-direction: column;
        border: 1px solid #ececeb;
        background: white;
      }

      &.section {
        background: #fff;
        padding-top: 20px;
        padding-bottom: 0px;
      }
    }

    ${inputCSS}
  }
`
