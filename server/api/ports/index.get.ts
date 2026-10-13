import {requireUser} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{await requireUser(e);return query('SELECT p.*,d.name AS device_name,d.device_type,d.rack_id FROM ports p JOIN devices d ON d.id=p.device_id ORDER BY d.name,p.port_number')})
