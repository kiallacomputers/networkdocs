import { requireAdmin } from '../../../utils/admin'
import { query } from '../../../utils/db'
export default defineEventHandler(async event => {
 await requireAdmin(event)
 return query(`SELECT s.id,s.name,s.description,s.company_id,c.name AS company_name
 FROM sites s LEFT JOIN companies c ON c.id=s.company_id ORDER BY s.name`)
})
