import React, { lazy } from 'react'
import { layouts } from '../../../../../app/web/types/layout'
import { pages } from '../../../../../app/web/types/page'
import newRouter from 'find-my-way'

export type Base = {
  layouts: typeof layouts
  pages: typeof pages
}

export const initRouter = async () => {
  const w = window as any
  w.base = {
    layouts,
    pages,
  } as Base
}

export const loadPage = (currentUrl: string) => {
  const w = window as any

  const base = w.base as Base

  if (!w.router) {
    const router = newRouter({})

    for (let [_, arg] of Object.entries(base.pages)) {
      const [url] = arg
      if (typeof url === 'string') {
        router.on('GET', url, () => arg)
      }
    }
    w.router = router
  }

  const route = w.router.find('GET', currentUrl)

  let params: any = null
  let importer: any = null
  let layout = 'default'
  if (route) {
    const routeFound = route.handler()
    importer = routeFound[2]
    layout = routeFound[1]
    params = route.params
  }
  w.params = params

  return {
    layout,
    component: lazy(() => {
      return new Promise<{ default: React.FC<{ layout?: any }> }>(
        async (resolve) => {
          if (importer) {
            const page = (await importer()).default
            resolve({ default: page.component })
          }
        }
      )
    }),
  }
}
