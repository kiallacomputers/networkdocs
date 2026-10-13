import {z} from 'zod'
import {requireSuperAdmin} from '../../../utils/companyAccess'
import {db} from '../../../utils/db'
const schema=z.object({company_id:z.number().int().positive(),user_id:z.number().int().positive(),role:z.enum(['admin','editor','viewer']).nullable()}).strict()
export default defineEventHandler(async event=>{
 const actor=await requireSuperAdmin(event)
 const parsed=schema.safeParse(await readBody(event));if(!parsed.success)throw createError({statusCode:400,statusMessage:'Invalid company assignment'})
 const b=parsed.data,c=await db().connect()
 try {await c.query('BEGIN')
 const exists=await c.query('SELECT 1 FROM users WHERE id=$1 AND is_active=true',[b.user_id]);if(!exists.rowCount)throw createError({statusCode:404,statusMessage:'Active user not found'})
 const company=await c.query('SELECT 1 FROM companies WHERE id=$1',[b.company_id]);if(!company.rowCount)throw createError({statusCode:404,statusMessage:'Company not found'})
 if(b.role===null)await c.query('DELETE FROM company_users WHERE user_id=$1 AND company_id=$2',[b.user_id,b.company_id])
 else await c.query('INSERT INTO company_users(user_id,company_id,role) VALUES($1,$2,$3) ON CONFLICT(user_id,company_id) DO UPDATE SET role=EXCLUDED.role',[b.user_id,b.company_id,b.role])
 await c.query('DELETE FROM sessions WHERE user_id=$1',[b.user_id])
 await c.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[actor.id,'update','company',b.company_id])
 await c.query('COMMIT');return {ok:true}
 }catch(err){await c.query('ROLLBACK');throw err}finally{c.release()}
})
