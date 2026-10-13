import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../utils/db'
const schema = z.object({
  display_name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(['admin','editor','viewer']).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(12).max(128).optional()
}).strict().refine(x => Object.keys(x).length > 0)
export default defineEventHandler(async event => {
  const admin = await requireAdmin(event)
  const id = Number(getRouterParam(event,'id'))
  if(!Number.isSafeInteger(id)||id<=0) throw createError({statusCode:400,statusMessage:'Invalid user ID'})
  const body = schema.parse(await readBody(event))
  if(id === Number(admin.id) && (body.is_active === false || (body.role && body.role !== 'admin'))) {
    throw createError({statusCode:400,statusMessage:'You cannot disable or demote your own account'})
  }
  if(id===1 && (body.role && body.role!=='admin' || body.is_active===false))throw createError({statusCode:403,statusMessage:'Cannot disable or demote bootstrap Super Admin'})
  const hash = body.password ? await bcrypt.hash(body.password,12) : null
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(`UPDATE users SET
      display_name=COALESCE($2,display_name), role=COALESCE($3,role),
      is_active=COALESCE($4,is_active), password_hash=COALESCE($5,password_hash)
      WHERE id=$1 RETURNING id,email,display_name,role,is_active,created_at`,
      [id,body.display_name??null,body.role??null,body.is_active??null,hash])
    if(!result.rowCount) throw createError({statusCode:404,statusMessage:'User not found'})
    if(body.is_active===false || body.password || body.role) await client.query('DELETE FROM sessions WHERE user_id=$1',[id])
    await client.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[admin.id,'update','user',id])
    await client.query('COMMIT')
    return result.rows[0]
  } catch(e) { await client.query('ROLLBACK'); throw e } finally { client.release() }
})
