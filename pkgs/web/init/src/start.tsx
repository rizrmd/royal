import ReactDOM from 'react-dom'
import { App } from './app'
import { init } from './core/init'
export type IBaseUrl = { mode: 'dev' | 'prod'; ips: string[] }
export const start = ({
  registerSW,
  baseUrl,
}: {
  registerSW: any
  baseUrl: (props: IBaseUrl) => string
}) => {
  init(baseUrl)

  const rootNode = document.getElementById('root')
  ReactDOM.render(<App />, rootNode)

  if (false) {
    registerSW({
      onOfflineReady() {},
    })
  }
}
