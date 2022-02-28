import { ReactElement } from 'web-app/types/react'

type IMobileLayoutProps = {}

type IBottomBarProps = {
  tabs: {
    url: string
    isActive?: (url: string) => boolean
    component: (props: { isActive: boolean }) => ReactElement
  }[]
}
