import { formatDistance } from 'date-fns'
import { page } from 'web-init'
import { useAuth, useGlobal, useLocal } from 'web-utils'
import { actionData, GlobalData } from '../global/data'

export default page({
  url: '/',
  component: ({}) => {
    return <div>Halo</div>
  }
})