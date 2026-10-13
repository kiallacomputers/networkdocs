import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { siteCompany,requireCompany } from '../../utils/companyAccess'
import { db } from '../../utils/db'
const schema=z.object({site_id:z.coerce.number().int().positive(),name:z.string().trim().min(1).max(120),code:z.string().trim().max(40).default(''),description:z.string().max(1000).default('')}).strict()
export default defineEventHandler(async event=>{
 const user=await requireUser(event,true),body=schema.parse(await readBody(event))
 await requireCompany(user,await siteCompany(body.site_id),true)
 const client=await db().connect()
 try{await client.query('BEGIN');const {rows}=await client.query('INSERT INTO buildings(site_id,name,code,description) VALUES($1,$2,$3,$4) RETURNING *',[body.site_id,body.name,body.code,body.description]);await client.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[user.id,'create','building',rows[0].id]);await client.query('COMMIT');return rows[0]}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
})
