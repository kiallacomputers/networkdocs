import {requireUser} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{await requireUser(e);return query('SELECT r.*,s.name AS site_name FROM racks r JOIN sites s ON s.id=r.site_id ORDER BY s.name,r.name')})
