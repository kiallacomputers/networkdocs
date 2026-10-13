import {requireUser} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{await requireUser(e);return query('SELECT * FROM sites ORDER BY name')})
