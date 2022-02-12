/** @jsx jsx */
import { FC, Fragment } from 'react'
import { IBottomBarProps } from './types'
import { useInitMobile } from './utils/use-init-mobile'

export const BottomBar: FC<IBottomBarProps> = ({ tabs }) => {
  const mobile = useInitMobile()

  if (!mobile.ready) return null

  const renderTab = (Component: any, tab: any, idx: any, isActive: boolean) => {
    return (
      <a
        href={tab.url}
        key={idx}
        class={
          'bottom-bar-btn cursor-pointer flex-1 py-3 px-3 transition duration-300 flex flex-col items-center ' +
          (isActive ? 'is-active' : '')
        }
      >
        <Component isActive={isActive} />
      </a>
    )
  }

  return (
    <Fragment>
      <nav class="bottom-bar inset-x-0 flex justify-between text-sm">
        {tabs.map((tab, idx) => {
          const Component = tab.component
          return renderTab(Component, tab, idx, location.pathname === tab.url)
        })}
      </nav>
    </Fragment>
  )
}
