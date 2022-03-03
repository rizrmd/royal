import { FC, ReactElement } from 'react'
import { Popover } from 'react-tiny-popover'
import { useLocal } from 'web-utils'
export const PopupList: FC<{ children: ReactElement; className?: string }> = ({
  children,
  className,
}) => {
  const local = useLocal(
    { isOpen: false, container: null as null | HTMLDivElement },
    () => {
      if (!document.body.querySelector('#popover-container')) {
        const container = document.createElement('div')
        container.id = 'popover-container'
        document.body.append(container)
      }
      const div = document.body.querySelector(
        '#popover-container'
      ) as HTMLDivElement

      local.container = div
    }
  )

  const onClick = () => {
    local.isOpen = true
    local.render()
  }

  return (
    <>
      {local.isOpen && (
        <div
          className="fixed bg-white bg-opacity-5 inset-0"
          onPointerDown={() => {
            local.isOpen = false
            local.render()
          }}
        ></div>
      )}
      <Popover isOpen={local.isOpen} content={<div></div>}>
        <div onPointerDown={onClick} onClick={onClick} className={className}>
          {children}
        </div>
      </Popover>
    </>
  )
}
