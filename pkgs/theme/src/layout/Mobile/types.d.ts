import { ReactElement } from 'react'

type IMobileLayoutProps = {}

type IBottomBarProps = {
  tabs: {
    url: string
    component: (props: { isActive: boolean }) => ReactElement
  }[]
}
