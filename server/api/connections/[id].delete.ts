import {requireUser,audit} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{const u=await requireUser(e,true);const id=Number(getRouterParam(e,'id'));if(!Number.isSafeInteger(id)||id<1)throw createError({statusCode:400});const r=await query('DELETE FROM connections WHERE id=$1 RETURNING id',[id]);if(!r.length)throw createError({statusCode:404});await audit(u,'delete','connection',id);return {ok:true}})
