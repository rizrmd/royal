import { IAppRoot } from 'index'
import { createRouter } from 'radix3'
import { FC, lazy } from 'react'
import layouts from '../../../../../app/web/types/layout'
import pages from '../../../../../app/web/types/page'

export type Base = {
  layouts: typeof layouts
  pages: typeof pages
}

export type IFoundPage = { layout: string; page: string; Page: FC; Layout: FC }

export const loadPageAndLayout = (local: IAppRoot) => {
  local.page.list = pages as any
  local.layout.list = layouts as any

  if (!local.router) {
    local.router = createRouter()
  }

  if (local.router) {
    let found = local.router.lookup(local.url)
    if (!found) {
      for (let [pageName, page] of Object.entries(local.page.list)) {
        const [url, layout, pageDef] = page as unknown as [
          string,
          string,
          () => Promise<{
            default: {
              url: string
              layout: string
              component: () => Promise<{
                default: React.ComponentType<any>
              }>
            }
          }>
        ]

        local.router.insert(url, {
          layout,
          page: pageName,
          Page: lazy(
            () =>
              new Promise<any>(async (resolve) => {
                const result = (await pageDef()).default.component

                resolve({
                  default: result,
                })
              })
          ),
          Layout: lazy(
            () =>
              new Promise<any>(async (resolve) => {
                const layoutFound = local.layout.list[layout]
                if (layoutFound) {
                  const result = (await layoutFound()).default

                  resolve({
                    default: result,
                  })
                } else {
                  resolve({
                    default: (children: any) => children,
                  })
                }
              })
          ),
        })
      }

      let found = local.router.lookup(local.url) as
        | IFoundPage
        | null
        | undefined

      if (found) {
        local.page.current = found.Page
        local.layout.current = found.Layout
      }

      return found
    }
  }
}
