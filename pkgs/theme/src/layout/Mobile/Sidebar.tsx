/** @jsx jsx  */
import { FC, Fragment } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'

export const Sidebar: FC<{ show?: boolean; onClose?: () => void }> = ({
  show,
  children,
  onClose,
}) => {
  return (
    <Fragment>
      <div
        className={`${
          !show ? 'pointer-events-none' : ''
        } flex absolute left-0 bottom-0 top-0 w-4/5`}
        css={css`
          z-index: 10001;
        `}
      >
        <AnimatePresence>
          {show && (
            <Fragment>
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{
                  x: '0',
                  transition: { duration: 0.3, type: 'tween' },
                }}
                exit={{
                  x: '-100%',
                  transition: { duration: 0.3, type: 'tween' },
                }}
                className="flex flex-col"
              >
                {children}
              </motion.aside>
            </Fragment>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {show && (
          <Fragment>
            <motion.div
              onPan={() => {
                if (onClose) onClose()
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
    </Fragment>
  )
}
