import { useEffect, useRef, useState } from 'react'

export const useLocal = <T extends any>(
  data: T,
  effect: () => Promise<void> | void
): T & { render: () => void } => {
  const meta = useRef(data as any)
  const internal = useRef({ mounted: true })
  useEffect(() => {
    if (effect) effect()
    return () => {
      internal.current.mounted = false
    }
  }, [])
  const [_, render] = useState({})
  meta.current.render = () => {
    if (internal.current.mounted) render({})
  }

  return meta.current
}
