  import type { db_type as dbs_db_type } from './db/index'
import { db as dbs_db }from './db/index'
  
  export default {
    db: dbs_db as dbs_db_type
  }