import { declareAPI } from 'web-init'

export default declareAPI(
  '/api/hashpassword',
  async ({ req, reply, ext, baseurl }) => {
    reply.send({
      hashedPW: ext.Password.hash(req.body.password),
      message: 'Success',
    })
  }
)
