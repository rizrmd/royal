import React, { lazy } from 'react'
import layouts from '../../../../../app/web/types/layout'
import pages from '../../../../../app/web/types/page'

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

export const loadPage = (currentUrl: string, onLoad: (comp: any) => void) => {
  const w = window as any

  const base = w.base as Base

  // if (!w.router) {
  //   const router = newRouter({})

  //   for (let [_, arg] of Object.entries(base.pages)) {
  //     const [url] = arg
  //     if (typeof url === 'string') {
  //       router.on('GET', url, () => arg)
  //     }
  //   }
  //   w.router = router

  //   w.router.pages = new WeakMap()
  // }
  // const route = w.router.find('GET', currentUrl)

  let params: any = null
  let importer: any = null
  let routeFound: any = null
  let page = null
  let layout = 'default'
  let component = null

  // if (route) {
  //   routeFound = route.handler()

  //   if (Array.isArray(routeFound)) {
  //     w.router.current = routeFound
  //     layout = routeFound[1]
  //     importer = routeFound[2]
  //     page = routeFound[3]
  //   }
  //   params = route.params
  // }
  // w.params = params


  // if (page) {
  //   component = page
  // } else if (importer) {
  //   component = lazy(() => {
  //     return new Promise<{ default: React.FC<{ layout?: any }> }>(
  //       async (resolve) => {
  //         if (importer) {
  //           const page = await importer()
  //           routeFound[3] = page.default.component
  //           onLoad(page.default.component)
  //           resolve({ default: page.default.component })
  //         }
  //       }
  //     )
  //   })
  // }

  return {
    layout,
    component,
  }
}
