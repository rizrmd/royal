/** @jsx jsx */
import { Component, lazy, Suspense, useEffect } from 'react'
import { GlobalContext, useLocal } from 'web-utils'
import { Base, loadPage } from './core/router'
import ErrorBoundary from './error'

export const App = () => {
  const w = window as any
  const base = w.base as Base
  const local = useLocal({
    url: null as any,
    components: {
      Layout: null as any,
      Page: null as any,
    },
    lastComponent: {
      Layout: null as any,
      Page: null as any,
    },
    global: new WeakMap(),
  })
  w.appRoot = local

  if (local.url !== location.pathname) {
    local.url = location.pathname
    local.lastComponent.Layout = local.components.Layout

    const page = loadPage(location.pathname)
    local.components.Page = page.component
    local.components.Layout = lazy((base.layouts as any)[page.layout])
  }

  useEffect(() => {
    return () => {
      location.reload()
    }
  }, [])

  const Layout = local.components.Layout
  const Page = local.components.Page
  const LastLayout = local.lastComponent.Layout

  return (
    <GlobalContext.Provider
      value={{
        global: local.global,
        render: () => {
          local.render()
        },
      }}
    >
      <Suspense fallback={LastLayout ? <LastLayout /> : null}>
        <ErrorBoundary>
          <Layout>
            <Suspense fallback={null}>
              <ErrorBoundary>
                <Page />
              </ErrorBoundary>
            </Suspense>
          </Layout>
        </ErrorBoundary>
      </Suspense>
    </GlobalContext.Provider>
  )
}
