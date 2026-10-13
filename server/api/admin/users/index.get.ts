import { requireAdmin } from '../../../utils/admin'
import { query } from '../../../utils/db'
export default defineEventHandler(async event => {
  await requireAdmin(event)
  return query('SELECT id,email,display_name,role,is_active,created_at FROM users ORDER BY id')
})
