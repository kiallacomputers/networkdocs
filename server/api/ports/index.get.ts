import { requireUser } from '../../utils/auth'
import { query } from '../../utils/db'
export default defineEventHandler(async event=>{const user=await requireUser(event);return query(`SELECT p.*,d.name AS device_name,d.device_type,d.rack_id FROM ports p JOIN devices d ON d.id=p.device_id WHERE $1::boolean OR d.company_id IN (SELECT company_id FROM company_users WHERE user_id=$2) ORDER BY d.name,p.port_number`,[user.is_super_admin===true,user.id])})
