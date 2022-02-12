import * as emotion from '@emotion/react'
export const jsx = (...args: any[]) => {
  const w = window as any
  const [_tag, _props] = args

  let tag = _tag
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

    if (w.isMobile) {
      tag = 'div'
    }

    propsModified = true
  }

  if (props.style) {
    props.css = css`
      ${props.style}
    `
    delete props.style
    propsModified = true
  }

  if (tag === 'img') {
    if (typeof props.draggable === 'undefined') {
      props.draggable = false
      propsModified = true
    }
    if (props.src.startsWith('http')) {
      props.style = { visibility: 'hidden' }
    }

    props.onLoad = (e: any) => {
      if (props.src.startsWith('http')) {
        e.target.style.visibility = 'visible'
      }
    }
  }

  if (propsModified) {
    return emotion.jsx(tag, props, ...args.slice(2))
  }

  return emotion.jsx(...args)
}
