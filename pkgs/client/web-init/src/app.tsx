/** @jsx jsx */
import { FC, lazy, Suspense, useEffect } from 'react'
import { GlobalContext, useLocal } from 'web-utils'
import { Base, loadPage } from './core/router'
import { ErrorBoundary } from './error'
import layouts from '../../../../app/web/types/layout'

export const App = () => {
  const w = window as any
  const base = w.base as Base
  const local = useLocal({
    url: null as any,
    components: {
      Layout: null as any,
      Page: null as any,
    },
    layouts: {} as Record<string, any>,
    lastLayout: null as any,
    global: new WeakMap(),
  })
  w.appRoot = local

  if (local.url !== location.pathname) {
    local.url = location.pathname

    const page = loadPage(location.pathname, (comp) => {
      local.components.Page = comp
    })
    local.components.Page = page.component

    const layout = (base.layouts as any)[page.layout]

    if (local.lastLayout !== layout) {
      local.lastLayout = layout
      if (!layout) {
        throw new Error(`Layout "${layout}" not found.`)
      }

      if (local.layouts[page.layout]) {
        local.components.Layout = local.layouts[page.layout]
      } else {
        local.components.Layout = lazy(() => {
          return new Promise<{ default: any }>(async (resolve) => {
            const component = await layout()
            local.components.Layout = component.default
            if (!local.layouts[page.layout])
              local.layouts[page.layout] = local.components.Layout

            resolve(component)
          })
        })
      }
    }
    for (let i of Object.values(w.pageOnLoad) as any) {
      i(local)
    }
  }

  useEffect(() => {
    for (let [k, v] of Object.entries(layouts)) {
      v().then((layout) => {
        if (!local.layouts[k]) local.layouts[k] = layout.default
      })
    }

    return () => {
      location.reload()
    }
  }, [])

  const Layout = local.components.Layout
  const Page = local.components.Page

  return (
    <GlobalContext.Provider
      value={{
        global: local.global,
        render: () => {
          local.render()
        },
      }}
    >
      <OptionalSuspense>
        <ErrorBoundary>
          <Layout>
            <OptionalSuspense>
              <ErrorBoundary>{Page && <Page />}</ErrorBoundary>
            </OptionalSuspense>
          </Layout>
        </ErrorBoundary>
      </OptionalSuspense>
    </GlobalContext.Provider>
  )
}

const OptionalSuspense: FC<{ children: any }> = ({ children }) => {
  return children.$$typeof ? (
    <Suspense fallback={null}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
  ) : (
    <ErrorBoundary>{children}</ErrorBoundary>
  )
}
