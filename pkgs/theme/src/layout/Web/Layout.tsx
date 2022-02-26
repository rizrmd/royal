/** @jsx jsx */
import { FC, ReactElement } from 'react'
import { themeStyle } from './style'

export const WebLayout: FC<{ sidebar?: ReactElement; className?: string }> = ({
  children,
  sidebar,
  className,
}) => {
  return (
    <div
      className={`h-screen w-full flex flex-row ${className}`}
      css={themeStyle}
    >
      {sidebar}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
