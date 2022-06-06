/** @jsx jsx */
import { createRouter } from 'radix3'
import { FC, Suspense } from 'react'
import { GlobalContext, useLocal } from 'web-utils'
import { IFoundPage, loadPageAndLayout } from './core/router'
import { ErrorBoundary } from './error'

export type IAppRoot = {
  url: string
  layout: {
    current?: FC
    last?: FC
    list: Record<string, () => Promise<{default: React.ComponentType<any>}>>
  }
  page: {
    current?: FC
    list: Record<
      string,
      () => Promise<{
        url: string
        component: () => Promise<React.ComponentType<any>>
      }>
    >
  }
  router?: ReturnType<typeof createRouter>
  cached: Record<
    'page' | 'layout',
    Record<string, { layout: string; page: FC }>
  >
  global: WeakMap<any, any>
  mounted: boolean
}

export const App = () => {
  const local = useLocal({
    url: '',
    layout: {},
    page: {},
    cached: { page: {}, layout: {} },
    mounted: true,
    global: new WeakMap(),
  } as IAppRoot)

  initPage(local)

  const Layout = local.layout.current
  const Page = local.page.current
  if (!Layout || !Page) {
    return null
  }

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
        <Layout>
          <OptionalSuspense>{Page && <Page />}</OptionalSuspense>
        </Layout>
      </OptionalSuspense>
    </GlobalContext.Provider>
  )
}

const initPage = async (local: IAppRoot) => {
  if (local.url !== location.pathname) {
    local.url = location.pathname

    loadPageAndLayout(local)
  }
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
