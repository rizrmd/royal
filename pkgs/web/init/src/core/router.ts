import React, { lazy } from 'react'
import { layouts } from '../../../../../app/web/types/layout'
import { pages } from '../../../../../app/web/types/page'
import { matchRoute } from 'web-utils'
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
  let params: any = null
  let importer: any = null
  let layout = 'default'
  for (let [pageName, arg] of Object.entries(base.pages) as any) {
    params = matchRoute(currentUrl, arg[0])
    if (params) {
      importer = arg[2]
      layout = arg[1]
    }
  }

  return {
    layout,
    component: lazy(() => {
      return new Promise<{ default: React.FC<{ layout?: any }> }>(
        async (resolve) => {
          if (importer) {
            w.params = params
            const page = (await importer()).default
            resolve({ default: page.component })
          }
        }
      )
    }),
  }
}
