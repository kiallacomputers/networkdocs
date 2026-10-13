import { requireUser } from '../../utils/auth'
import { query } from '../../utils/db'
export default defineEventHandler(async event=>{
 const u=await requireUser(event)
 return query(`SELECT c.id,c.name,cu.role FROM companies c LEFT JOIN company_users cu ON cu.company_id=c.id AND cu.user_id=$1 WHERE $2::boolean OR cu.user_id IS NOT NULL ORDER BY c.name`,[u.id,u.is_super_admin===true])
})
