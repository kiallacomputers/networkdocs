import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../utils/db'
const schema = z.object({
  email: z.email().max(254), display_name: z.string().trim().min(1).max(120),
  password: z.string().min(12).max(128), role: z.enum(['admin','editor','viewer'])
}).strict()
export default defineEventHandler(async event => {
  const admin = await requireAdmin(event)
  const body = schema.parse(await readBody(event))
  const hash = await bcrypt.hash(body.password, 12)
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query('INSERT INTO users(email,password_hash,display_name,role,is_active) VALUES($1,$2,$3,$4,true) RETURNING id,email,display_name,role,is_active,created_at', [body.email.trim().toLowerCase(),hash,body.display_name,body.role])
    const user = result.rows[0]
    await client.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[admin.id,'create','user',user.id])
    await client.query('COMMIT')
    return user
  } catch(e:any) {
    await client.query('ROLLBACK')
    if(e?.code==='23505') throw createError({statusCode:409,statusMessage:'Email already exists'})
    throw e
  } finally { client.release() }
})
