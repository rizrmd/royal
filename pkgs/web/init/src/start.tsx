import React from 'react'
import ReactDOM from 'react-dom'
import { init } from './core/init'
import { App } from './app'

export const start = ({ registerSW }: { registerSW: any }) => {
  init()

  const rootNode = document.getElementById('root')
  ReactDOM.render(<App />, rootNode)

  const updateSW = registerSW({
    onOfflineReady() {},
  })
}
