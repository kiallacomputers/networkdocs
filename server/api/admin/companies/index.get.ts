import { requireAdmin } from '../../../utils/admin'
import { query } from '../../../utils/db'
export default defineEventHandler(async event => {
 await requireAdmin(event)
 return query(`SELECT c.id,c.name,c.description,c.created_at,
  (SELECT count(*)::int FROM sites s WHERE s.company_id=c.id) AS site_count
  FROM companies c ORDER BY c.name`)
})
