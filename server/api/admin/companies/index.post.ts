import { z } from 'zod'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../utils/db'
const schema=z.object({name:z.string().trim().min(1).max(160),description:z.string().max(1000).default('')}).strict()
export default defineEventHandler(async event => {
 const user=await requireAdmin(event)
 const body=schema.safeParse(await readBody(event))
 if(!body.success) throw createError({statusCode:400,statusMessage:'Invalid company details'})
 const c=await db().connect()
 try {
  await c.query('BEGIN')
  const r=await c.query('INSERT INTO companies(name,description) VALUES($1,$2) RETURNING *',[body.data.name,body.data.description])
  await c.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[user.id,'create','company',r.rows[0].id])
  await c.query('COMMIT');return r.rows[0]
 } catch(err:any) {await c.query('ROLLBACK');if(err.code==='23505')throw createError({statusCode:409,statusMessage:'Company name already exists'});throw err}finally{c.release()}
})
