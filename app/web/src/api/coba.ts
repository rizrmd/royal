import { declareAPI } from 'web-init'

export default declareAPI('/coba', async ({ req, reply, ext, baseurl }) => {
  reply.send({
    halo: 'hore hore sodara ',
  })
})
