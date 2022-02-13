/** @jsx jsx  */
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  useVelocity,
} from 'framer-motion'
import { FC, Fragment, useEffect } from 'react'
import { useLocal } from 'web-utils'

export const Sidebar: FC<{
  show?: boolean
  onClose?: () => void
  className?: string
  backdrop?: boolean
}> = ({ show, children, backdrop, onClose, className }) => {
  const dragControls = useDragControls()

  function startDrag(event: any) {
    dragControls.start(event)
  }

  return (
    <Fragment>
      <AnimatePresence>
        {show && (
          <motion.aside
            drag="x"
            dragListener={false}
            dragConstraints={{ right: 0 }}
            dragElastic={0}
            initial={{ x: '-100%' }}
            onDragEnd={onClose}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween' }}
            dragControls={dragControls}
            className={`absolute top-0 left-0 bottom-0 ${className}`}
            css={css`
              z-index: 10001;
            `}
          >
            {children}
          </motion.aside>
        )}
      </AnimatePresence>

      {backdrop !== false && (
        <AnimatePresence>
          {show && (
            <Fragment>
              <motion.div
                onPointerDown={startDrag}
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
