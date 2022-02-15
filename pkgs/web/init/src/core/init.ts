import { css } from '@emotion/react'
import React, { Fragment } from 'react'
import { initDbs } from './dbs'
import { jsx } from './jsx'
import { initRouter } from './router'

export const init = () => {
  const w = window as any
  w.css = css
  w.jsx = jsx
  w.Fragment = Fragment
  w.React = React

  if (w.Capacitor) {
    w.isMobile = true
    w.mobile = {
      ready: false,
      insets: null,
    }
  }

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
