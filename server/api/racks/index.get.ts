import { requireUser } from '../../utils/auth'
import { query } from '../../utils/db'
export default defineEventHandler(async event=>{const user=await requireUser(event);return query(`SELECT r.*,s.name AS site_name FROM racks r JOIN sites s ON s.id=r.site_id WHERE $1::boolean OR s.company_id IN (SELECT company_id FROM company_users WHERE user_id=$2) ORDER BY s.name,r.name`,[user.is_super_admin===true,user.id])})
