import { createHash,randomBytes } from 'node:crypto'
import { query } from './db'
export const tokenHash=(t:string)=>createHash('sha256').update(t).digest('hex')
export const newToken=()=>randomBytes(32).toString('hex')
export async function currentUser(event:any){const token=getCookie(event,'nd_session');if(!token)return null;const rows=await query('SELECT u.id,u.email,u.display_name,u.role,u.is_super_admin FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.is_active=true',[tokenHash(token)]);return rows[0]||null}
export async function requireUser(event:any,write=false){const user=await currentUser(event);if(!user)throw createError({statusCode:401,statusMessage:'Login required'});if(write && !user.is_super_admin && !['admin','editor'].includes(user.role))throw createError({statusCode:403,statusMessage:'Read-only access'});return user}
export async function audit(user:any,action:string,entity:string,id:number|null){await query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[user.id,action,entity,id])}
