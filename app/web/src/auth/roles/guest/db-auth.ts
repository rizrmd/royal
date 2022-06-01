import { dbAuth } from 'platform'

export default dbAuth(({ table, action, db, params }) => {
  return true // allow all access
})
