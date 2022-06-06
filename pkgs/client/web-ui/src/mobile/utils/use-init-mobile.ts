import { useEffect } from 'react'
import { useLocal } from 'web-utils'
export const useInitMobile = () => {
  const w = window as any

  if (!w.mobile) {
    w.mobile = {}
    w.isMobile = true
  }

  const local = useLocal(
    {
      insets: w.mobile.insets,
      ready: w.mobile.ready,
    },
    async () => {
      const cap = w.Capacitor
      if (!w.mobile.ready) {
        local.insets = w.mobile.insets = {
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
        }
        if (cap && cap.Plugins) {
          if (cap.Plugins.SuppressLongpressGesture) {
            cap.Plugins.SuppressLongpressGesture.activateService()
          }

          if (cap.Plugins.SafeArea) {
            const safeArea = await cap.Plugins.SafeArea.getSafeAreaInsets()
            local.insets = w.mobile.insets = safeArea.insets
          }
        }
        local.ready = w.mobile.ready = true
        local.render()
      }
    }
  )
  return local
}
