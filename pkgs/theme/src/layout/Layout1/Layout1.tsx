/** @jsx jsx */
import { FC, ReactElement } from 'react'
import { Header } from './Header'
import { themeStyle } from './style'
import { Box1 } from './Box1'

export const Layout1: FC<{ sidebar?: ReactElement }> = ({
  children,
  sidebar,
}) => {
  return (
    <div className="h-screen w-full flex flex-row" css={themeStyle}>
      <div className="drawer drawer-mobile">
        <div className="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content">
          {sidebar}
        </div>
      </div>
      <main className="flex-1 bg-base-200">
        {/* <Header /> */}
        <div className="flex flex-1 flex-col">{children}</div>
      </main>
    </div>
  )
}
