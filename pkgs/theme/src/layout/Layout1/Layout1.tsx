/** @jsx jsx */
import { FC, ReactElement } from 'react'
import { themeStyle } from './style'

export const Layout1: FC<{ sidebar?: ReactElement }> = ({
  children,
  sidebar,
}) => {
  return (
    <div className="h-screen w-full flex flex-row bg-gray-50" css={themeStyle}>
      <div className="drawer drawer-mobile">
        <div className="menu overflow-y-auto w-80 text-base-content">
          {sidebar}
        </div>
      </div>
      <main className="flex-1">
        {/* <Header /> */}
        <div className="flex flex-1 flex-col">{children}</div>
      </main>
    </div>
  )
}
