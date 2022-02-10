import { css } from '@emotion/react'
import { Fragment } from 'react'
import { initDbs } from './dbs'
import { jsx } from './jsx'
import { initRouter } from './router'

export const init = () => {
  const w = window as any
  w.css = css
  w.jsx = jsx
  w.Fragment = Fragment
  w.navigate = (href: string) => {
    history.pushState({}, '', href)
    w.appRoot.render()
  }
  window.addEventListener('popstate', () => {
    w.appRoot.render()
  })
  initRouter()
  initDbs()
}
