/** @jsx jsx  */
import { AnimatePresence, motion } from 'framer-motion'
import { FC, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useGlobal, useLocal } from 'web-utils'
import { uiGlobalModal } from '../global/modal'
export const Modal: FC<{
  backdrop?: boolean
  onClose?: () => void
  show?: boolean
  animate?: false | 'fade' | 'bottom' | 'left' | 'top' | 'right'
}> = ({ children, onClose, show, animate }) => {
  const global = useGlobal(uiGlobalModal, () => {
    global.counter += 1
  })
  const local = useLocal({
    bganim: null as any,
    anim: null as any,
  })

  if (local.anim === null) {
    local.bganim = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }

    if (animate === false) {
      local.anim = {}
      local.bganim = {}
    } else if (animate === 'fade' || animate === undefined) {
      local.anim = local.bganim
    } else if (animate === 'bottom') {
      local.anim = {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
      }
    } else if (animate === 'left') {
      local.anim = {
        initial: { x: '-100%' },
        animate: { x: 0 },
        exit: { x: '-100%' },
      }
    } else if (animate === 'top') {
      local.anim = {
        initial: { y: '-100%' },
        animate: { y: 0 },
        exit: { y: '-100%' },
      }
    } else if (animate === 'right') {
      local.anim = {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
      }
    }
  }

  if (!document.getElementById('floating-container')) {
    const div = document.createElement('div')
    div.id = 'floating-container'
    document.querySelector('#root')?.appendChild(div)
  }

  const container = document.getElementById('floating-container')

  if (container) {
    return createPortal(
      <AnimatePresence>
        {show && (
          <Fragment>
            <motion.div
              {...local.anim}
              transition={{ mode: 'tween' }}
              className="absolute inset-0 flex items-center justify-center"
              css={css`
                z-index: ${global.counter + 20000 + 1};
              `}
              onClick={() => {
                if (onClose) onClose()
              }}
            >
              {children}
            </motion.div>
            <motion.div
              {...local.bganim}
              className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"
              css={css`
                pointer-events: ${!show ? 'none' : 'all'};
                z-index: ${global.counter + 20000};
              `}
            />
          </Fragment>
        )}
      </AnimatePresence>,
      container
    )
  }
  return null
}
