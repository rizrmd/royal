import { css } from '@emotion/react'
import React, { Fragment } from 'react'
import { IBaseUrl } from '../start'
import { initDbs } from './dbs'
import { jsx } from './jsx'
import { initRouter } from './router'

export const init = (baseUrl: (props: IBaseUrl) => string) => {
  const w = window as any
  if (!w.css) {
    if (!w.mode) w.mode = 'dev'
    w.baseurl = baseUrl({ mode: w.mode, ips: w.ips || [] })
    if (typeof w.baseurl !== 'string') {
      w.baseurl = `${location.protocol}//${location.host}/`
    }
    if (w.baseurl.endsWith('/')) {
      w.baseurl = w.baseurl.substring(0, w.baseurl.length - 1)
    }
    w.css = css
    w.jsx = jsx
    w.Fragment = Fragment
    w.React = React
    w.pageOnLoad = {}
    w.preventPopRender = false

    if (w.Capacitor) {
      w.isMobile = true
      w.mobile = {
        ready: false,
        insets: null,
      }
      if (w.Capacitor.Plugins) {
        const app = w.Capacitor.Plugins.App
        if (app) {
          app.addListener('backButton', () => {
            history.back()
          })
        }
      }
    }

    w.navigate = (href: string) => {
      if (w.appRoot.unmounted) {
        location.href = href
        return
      }
      history.pushState({}, '', href)
      w.appRoot.render()
    }
    window.addEventListener('popstate', () => {
      if (w.preventPopRender) {
        w.preventPopRender = false
        return
      }
      w.appRoot.render()
    })

    initRouter()
    initDbs()
  }
}
