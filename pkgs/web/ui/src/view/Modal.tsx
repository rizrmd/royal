/** @jsx jsx  */
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { FC, Fragment } from 'react'
import { createPortal } from 'react-dom'

export const Modal: FC<{ backdrop?: boolean }> = () => {
  const x = useMotionValue(0)

  if (!document.getElementById('floating-container')) {
    const div = document.createElement('div')
    div.id = 'floating-container'
    document.querySelector('#root')?.appendChild(div)
  }

  const container = document.getElementById('floating-container')
  if (!container) return null

  return createPortal(<div></div>, container)
}
