/** @jsx jsx  */
import { css } from '@emotion/react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { FC, Fragment, useEffect } from 'react'
import { useLocal } from 'web-utils'

export const Sidebar: FC<{
  show?: boolean
  onClose?: () => void
  onShow?: () => void
  className?: string
  backdrop?: boolean
}> = ({ show, children, backdrop, onClose, onShow, className }) => {
  const local = useLocal({
    showByDrag: false,
    animating: false,
  })
  const dragControls = useDragControls()

  function startDrag(event: any) {
    if (!local.animating) dragControls.start(event)
  }

  return (
    <Fragment>
      <AnimatePresence>
        <motion.aside
          drag="x"
          dragListener={false}
          dragConstraints={{ right: 0, left: '-100%' }}
          dragElastic={0}
          initial={{ x: show ? 0 : '-100%' }}
          onDragEnd={() => {
            if (show) {
              if (local.showByDrag) {
                local.showByDrag = false
              } else if (onClose) onClose()
            } else {
              if (onShow) onShow()
            }
          }}
          onAnimationStart={() => {
            local.animating = true
          }}
          onAnimationComplete={() => {
            local.animating = false
          }}
          animate={{ x: show ? 0 : '-100%' }}
          exit={{ x: !show ? 0 : '-100%' }}
          transition={{ type: 'tween' }}
          dragControls={dragControls}
          className={`absolute top-0 left-0 bottom-0 ${className}`}
          css={css`
            z-index: 10001;
          `}
        >
          {children}
        </motion.aside>
      </AnimatePresence>
      {backdrop !== false && (
        <AnimatePresence>
          {show && (
            <Fragment>
              <motion.div
                onPointerDown={startDrag}
                onPointerUp={() => {
                  setTimeout(() => {
                    if (show && onClose) onClose()
                  }, 200)
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                css={css`
                  z-index: 10000;
                `}
                className="absolute inset-0 bg-black bg-opacity-50"
              ></motion.div>
            </Fragment>
          )}
        </AnimatePresence>
      )}
    </Fragment>
  )
}
