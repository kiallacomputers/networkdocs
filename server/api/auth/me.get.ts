import {currentUser} from '../../utils/auth'
export default defineEventHandler(async(event)=>({user:await currentUser(event)}))
