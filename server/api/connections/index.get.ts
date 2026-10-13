import {requireUser} from '../../utils/auth'
import {query} from '../../utils/db'
export default defineEventHandler(async(e)=>{await requireUser(e);return query('SELECT c.*,a.device_id AS a_device_id,a.port_number AS a_number,da.name AS a_device,b.device_id AS b_device_id,b.port_number AS b_number,db.name AS b_device FROM connections c JOIN ports a ON a.id=c.port_a_id JOIN ports b ON b.id=c.port_b_id JOIN devices da ON da.id=a.device_id JOIN devices db ON db.id=b.device_id ORDER BY c.id DESC')})
