import * as emotion from '@emotion/react'
export const jsx = (...args: any[]) => {
  const [tag, _props] = args

  let propsModified = false
  const props = { ..._props }
  if (props.class) {
    propsModified = true
    props.className = `${props.className || ''} ${props.class}`
    delete props.class
  }

  if (tag === 'label' && props.for) {
    propsModified = true
    props.htmlFor = props.for
    delete props.for
  }

  if (
    tag === 'a' &&
    typeof props.href === 'string' &&
    props.href.startsWith('/')
  ) {
    const onClick = props.onClick
    props.onClick = (e: any) => {
      if (!onClick) {
        e.stopPropagation()
        e.preventDefault()
        navigate(props.href)
      } else {
        onClick(e)
      }
    }
    propsModified = true
  }

  if (propsModified) {
    return emotion.jsx(tag, props, ...args.slice(2))
  }

  return emotion.jsx(...args)
}
