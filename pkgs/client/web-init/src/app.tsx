/** @jsx jsx */
import { FC, ReactElement } from 'react'
import { useLocal } from 'web-utils'

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

  return <div>mteaiomt ini gila</div>
}
