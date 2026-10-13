import {requireUser} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{await requireUser(e);return query('SELECT d.*,r.name AS rack_name,s.name AS site_name FROM devices d LEFT JOIN racks r ON r.id=d.rack_id LEFT JOIN sites s ON s.id=r.site_id ORDER BY d.name')})
