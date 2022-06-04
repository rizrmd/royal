import { login } from 'platform'

export default login(async ({ db, req, reply }) => {
  const body = req.body as any

  if (body.username === 'admin' && body.password === 'admin') {
    req.session.data = {
      username: 'admin',
    }

    req.session.role = 'superadmin'
  }

  reply.send(req.session)
})
