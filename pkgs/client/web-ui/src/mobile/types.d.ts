import { ReactElement } from '../../../../../app/web/types/react'

type IMobileLayoutProps = {}

type IBottomBarProps = {
  tabs: {
    url: string
    isActive?: (url: string) => boolean
    component: (props: { isActive: boolean }) => ReactElement
  }[]
}
