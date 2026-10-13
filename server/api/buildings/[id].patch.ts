import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { siteCompany,requireCompany } from '../../utils/companyAccess'
import { db } from '../../utils/db'
const schema=z.object({name:z.string().trim().min(1).max(120),code:z.string().trim().max(40),description:z.string().max(1000)}).strict()
export default defineEventHandler(async event=>{
 const user=await requireUser(event,true),id=Number(getRouterParam(event,'id')),body=schema.parse(await readBody(event))
 if(!Number.isSafeInteger(id)||id<1)throw createError({statusCode:400,statusMessage:'Invalid building'})
 const client=await db().connect()
 try{await client.query('BEGIN');const current=await client.query('SELECT site_id FROM buildings WHERE id=$1 FOR UPDATE',[id]);if(!current.rowCount)throw createError({statusCode:404,statusMessage:'Building not found'});await requireCompany(user,await siteCompany(current.rows[0].site_id),true);const {rows}=await client.query('UPDATE buildings SET name=$1,code=$2,description=$3 WHERE id=$4 RETURNING *',[body.name,body.code,body.description,id]);await client.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[user.id,'update','building',id]);await client.query('COMMIT');return rows[0]}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
})
