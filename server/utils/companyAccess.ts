import { query } from './db'
import { requireUser } from './auth'
export async function tenantUser(event:any) { return await requireUser(event) }
export function superAdmin(user:any) { return user.is_super_admin === true }
export async function requireSuperAdmin(event:any) {
 const user=await tenantUser(event)
 if(!superAdmin(user)) throw createError({statusCode:403,statusMessage:'Super Administrator access required'})
 return user
}
// A user's global role is their ceiling; company membership can only reduce access.
export type CompanyRole = 'admin' | 'editor' | 'viewer'
const roleRank: Record<CompanyRole,number> = { viewer: 1, editor: 2, admin: 3 }
export function effectiveCompanyRole(user:any, assignedRole:CompanyRole|null):CompanyRole|null {
 if(superAdmin(user)) return 'admin'
 if(!assignedRole) return null
 const globalRole = user.role as CompanyRole
 if(!(globalRole in roleRank)) return null
 return roleRank[globalRole] <= roleRank[assignedRole] ? globalRole : assignedRole
}
export async function companyIds(user:any, write=false):Promise<number[]> {
 if(superAdmin(user)) return []
 if(write && !['admin','editor'].includes(user.role)) return []
 const rows=await query(`SELECT company_id,role FROM company_users WHERE user_id=$1`,[user.id])
 return rows.filter((r:any)=>{
  const role=effectiveCompanyRole(user,r.role)
  return role && (!write || role==='editor' || role==='admin')
 }).map((r:any)=>Number(r.company_id))
}
export async function requireCompany(user:any, companyId:number|null|undefined,write=false) {
 if(superAdmin(user)) return
 if(!companyId) throw createError({statusCode:403,statusMessage:'Company access required'})
 const rows=await query(`SELECT role FROM company_users WHERE user_id=$1 AND company_id=$2`,[user.id,companyId])
 const role=effectiveCompanyRole(user,rows[0]?.role??null)
 if(!role || (write && role==='viewer')) throw createError({statusCode:403,statusMessage:'Company access denied'})
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
