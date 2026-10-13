import { z } from 'zod'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../utils/db'
const schema=z.object({site_id:z.number().int().positive(),company_id:z.number().int().positive()}).strict()
export default defineEventHandler(async event=>{
 const user=await requireAdmin(event)
 const b=schema.safeParse(await readBody(event))
 if(!b.success)throw createError({statusCode:400,statusMessage:'Invalid site assignment'})
 const c=await db().connect()
 try{
  await c.query('BEGIN')
  const company=await c.query('SELECT id FROM companies WHERE id=$1',[b.data.company_id])
  if(!company.rowCount)throw createError({statusCode:404,statusMessage:'Company not found'})
  const site=await c.query('UPDATE sites SET company_id=$1 WHERE id=$2 RETURNING id',[b.data.company_id,b.data.site_id])
  if(!site.rowCount)throw createError({statusCode:404,statusMessage:'Site not found'})
  await c.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[user.id,'update','site',b.data.site_id])
  await c.query('COMMIT');return {ok:true}
 }catch(err){await c.query('ROLLBACK');throw err}finally{c.release()}
})
