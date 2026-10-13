import {z} from 'zod'
import {requireUser,audit} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{const u=await requireUser(e,true);const b=z.object({site_id:z.coerce.number().int().positive(),name:z.string().trim().min(1).max(120),height_u:z.coerce.number().int().min(1).max(60),location:z.string().max(200).default('')}).parse(await readBody(e));const r=await query('INSERT INTO racks(site_id,name,height_u,location) VALUES($1,$2,$3,$4) RETURNING *',[b.site_id,b.name,b.height_u,b.location]);await audit(u,'create','rack',r[0].id);return r[0]})
