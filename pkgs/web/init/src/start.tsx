import React from 'react'
import ReactDOM from 'react-dom'
import { init } from './core/init'
import { App } from './app'

export const start = ({}: { registerSW: any }) => {
  init()

  const rootNode = document.getElementById('root')
  ReactDOM.render(<App />, rootNode)
}
