import { css } from '@emotion/react'
import { IAppRoot } from 'index'
import React, { Fragment } from 'react'
import { initDbs } from './dbs'
import { jsx } from './jsx'

declare global {
  interface Window {
    mode: 'dev' | 'prod'
    css: typeof css
    jsx: typeof jsx
    Fragment: typeof Fragment
    Capacitor: any
    isMobile: boolean
    mobile: {
      ready: boolean
      insets: any
    }
    navigate: (href: string) => void
    preventPopRender: boolean
    appRoot: IAppRoot & { render: () => void }
  }
}
