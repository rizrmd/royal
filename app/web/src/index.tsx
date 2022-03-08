import { registerSW } from 'virtual:pwa-register'
import { start } from 'web-init'
import './index.css'
import baseUrl from './baseurl'

start({
  registerSW,
  baseUrl,
})
