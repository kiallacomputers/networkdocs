import { query } from './db'
import { requireUser } from './auth'
export async function tenantUser(event:any) { return await requireUser(event) }
export function superAdmin(user:any) { return user.is_super_admin === true }
export async function requireSuperAdmin(event:any) {
 const user=await tenantUser(event)
 if(!superAdmin(user)) throw createError({statusCode:403,statusMessage:'Super Administrator access required'})
 return user
}
export async function companyIds(user:any, write=false):Promise<number[]> {
 if(superAdmin(user)) return []
 const rows=await query(`SELECT company_id FROM company_users WHERE user_id=$1 AND ($2::boolean=false OR role IN ('admin','editor'))`,[user.id,write])
 return rows.map((r:any)=>Number(r.company_id))
}
export async function requireCompany(user:any, companyId:number|null|undefined,write=false) {
 if(superAdmin(user)) return
 if(!companyId) throw createError({statusCode:403,statusMessage:'Company access required'})
 const rows=await query(`SELECT 1 FROM company_users WHERE user_id=$1 AND company_id=$2 AND ($3::boolean=false OR role IN ('admin','editor'))`,[user.id,companyId,write])
 if(!rows.length) throw createError({statusCode:403,statusMessage:'Company access denied'})
}
export async function siteCompany(siteId:number) {
 const rows=await query('SELECT company_id FROM sites WHERE id=$1',[siteId]);if(!rows.length)throw createError({statusCode:404,statusMessage:'Site not found'});return rows[0].company_id===null?null:Number(rows[0].company_id)
}
export async function rackCompany(rackId:number) {
 const rows=await query('SELECT s.company_id FROM racks r JOIN sites s ON s.id=r.site_id WHERE r.id=$1',[rackId]);if(!rows.length)throw createError({statusCode:404,statusMessage:'Rack not found'});return rows[0].company_id===null?null:Number(rows[0].company_id)
}
export async function deviceCompany(deviceId:number) {
 const rows=await query('SELECT company_id FROM devices WHERE id=$1',[deviceId]);if(!rows.length)throw createError({statusCode:404,statusMessage:'Device not found'});return rows[0].company_id===null?null:Number(rows[0].company_id)
}
export async function portCompany(portId:number) {
 const rows=await query('SELECT d.company_id FROM ports p JOIN devices d ON d.id=p.device_id WHERE p.id=$1',[portId]);if(!rows.length)throw createError({statusCode:404,statusMessage:'Port not found'});return rows[0].company_id===null?null:Number(rows[0].company_id)
}
export async function connectionCompany(id:number) {
 const rows=await query('SELECT da.company_id AS a,db.company_id AS b FROM connections c JOIN ports pa ON pa.id=c.port_a_id JOIN ports pb ON pb.id=c.port_b_id JOIN devices da ON da.id=pa.device_id JOIN devices db ON db.id=pb.device_id WHERE c.id=$1',[id]);if(!rows.length)throw createError({statusCode:404,statusMessage:'Connection not found'});if(rows[0].a!==rows[0].b)throw createError({statusCode:409,statusMessage:'Cross-company connection'});return rows[0].a===null?null:Number(rows[0].a)
}
