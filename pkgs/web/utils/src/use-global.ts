import { createContext, FC, useContext, useReducer, useState } from 'react'

export const GlobalContext = createContext({
  global: new WeakMap(),
  render: () => {},
})

export const useGlobal = <T extends object>(
  defaultValue: T
): T & { render: () => void } => {
  const { global, render } = useContext(GlobalContext)

  if (!global.has(defaultValue)) {
    global.set(defaultValue, { ...defaultValue })
  }

  const res = global.get(defaultValue)
  res.render = render
  return res
}
