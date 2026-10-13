import {z} from 'zod'
import {requireUser,audit} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{const u=await requireUser(e,true);const b=z.object({name:z.string().trim().min(1).max(120),description:z.string().max(1000).default('')}).parse(await readBody(e));const r=await query('INSERT INTO sites(name,description) VALUES($1,$2) RETURNING *',[b.name,b.description]);await audit(u,'create','site',r[0].id);return r[0]})
