import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query } from '../../utils/db'
import { newToken,tokenHash } from '../../utils/auth'
export default defineEventHandler(async(event)=>{const body=z.object({email:z.email(),password:z.string()}).parse(await readBody(event));const rows=await query('SELECT * FROM users WHERE email=$1',[body.email.toLowerCase()]);const u=rows[0];if(!u||!(await bcrypt.compare(body.password,u.password_hash)))throw createError({statusCode:401,statusMessage:'Invalid credentials'});const token=newToken();await query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",[tokenHash(token),u.id]);setCookie(event,'nd_session',token,{httpOnly:true,sameSite:'strict',secure:!import.meta.dev,path:'/',maxAge:43200});return {id:u.id,email:u.email,display_name:u.display_name,role:u.role}})
