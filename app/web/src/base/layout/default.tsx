import { useEffect } from 'react'
import { Layout1 } from 'theme'
import { layout } from 'web-init'
import { useAuth } from 'web-utils'

export default layout({
  component: ({ children }) => {
    return <>{children}</>
  },
})
