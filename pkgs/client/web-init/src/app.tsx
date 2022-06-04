/** @jsx jsx */
import { FC, lazy, ReactElement, Suspense, useEffect } from 'react'
import { GlobalContext, useLocal } from 'web-utils'
import { Base, loadPage } from './core/router'
import { ErrorBoundary } from './error'
import layouts from '../../../../app/web/types/layout'

export type IAppRoot = {
  url: string
  layout: {
    current?: ReactElement
    last?: ReactElement
    list: Record<string, FC>
  }
  page: {
    current?: ReactElement
  }
  mounted: boolean
}

export const App = () => {
  const local = useLocal({
    url: '',
    layout: {
      list: {} as Record<string, any>,
    },
    page: {},
    mounted: true,
  } as IAppRoot)

  return <div>Haloha</div>
}
