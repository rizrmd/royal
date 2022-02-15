/** @jsx jsx  */
import { useMotionValue } from 'framer-motion'
import { FC } from 'react'
import { createPortal } from 'react-dom'

export const Modal: FC<{
  backdrop?: boolean
  onClose?: () => void
  show?: boolean
}> = ({ children, onClose, show }) => {
  if (!document.getElementById('floating-container')) {
    const div = document.createElement('div')
    div.id = 'floating-container'
    document.querySelector('#root')?.appendChild(div)
  }

  const container = document.getElementById('floating-container')
  if (!container || !show) return null

  return createPortal(
    <div
      className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"
      css={css`
        z-index: 20000;
      `}
      onClick={() => {
        if (onClose) onClose()
      }}
    >
      {children}
    </div>,
    container
  )
}
