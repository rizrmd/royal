import { logout } from 'platform'

export default logout(async ({ req }) => {
  req.session.role = ''
})
