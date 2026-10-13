import {query} from '../../utils/db'
import {tokenHash} from '../../utils/auth'
export default defineEventHandler(async(event)=>{const token=getCookie(event,'nd_session');if(token)await query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(token)]);deleteCookie(event,'nd_session',{path:'/'});return {ok:true}})
