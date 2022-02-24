/** @jsx jsx */
import { FC, Fragment } from 'react'
import { styles } from './styles'
import { IMobileLayoutProps } from './types'
import { useInitMobile } from './utils/use-init-mobile'

export const MobileLayout: FC<IMobileLayoutProps> = ({ children }) => {
  const mobile = useInitMobile()

  if (!mobile.ready) return null
  return (
    <div
      className="mobile-layout flex flex-col flex-1 w-full h-screen"
      css={styles.init({ insets: mobile.insets })}
    >
      <div className="safe-area-top"></div>
      {children}
      <div className="safe-area-bottom"></div>
    </div>
  )
}
