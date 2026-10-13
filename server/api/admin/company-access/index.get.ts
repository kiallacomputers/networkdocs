import { requireSuperAdmin } from '../../../utils/companyAccess'
import { query } from '../../../utils/db'
export default defineEventHandler(async event=>{await requireSuperAdmin(event);return query(`SELECT cu.company_id,cu.user_id,cu.role,c.name AS company_name,u.display_name,u.email FROM company_users cu JOIN companies c ON c.id=cu.company_id JOIN users u ON u.id=cu.user_id ORDER BY c.name,u.display_name`)})
