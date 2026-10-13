import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { requireCompany } from '../../../utils/companyAccess'
import { db } from '../../../utils/db'
const schema=z.object({site_id:z.number().int().positive().nullable(),building_id:z.number().int().positive().nullable(),rack_id:z.number().int().positive().nullable(),rack_u:z.number().int().min(1).max(60).nullable(),floor:z.string().trim().max(80),room:z.string().trim().max(160)}).strict()
export default defineEventHandler(async event=>{
 const user=await requireUser(event,true)
 const id=Number(getRouterParam(event,'id'))
 if(!Number.isSafeInteger(id)||id<1)throw createError({statusCode:400,statusMessage:'Invalid device ID'})
 const parsed=schema.safeParse(await readBody(event))
 if(!parsed.success)throw createError({statusCode:400,statusMessage:'Invalid location fields'})
 const b=parsed.data
 if((b.rack_id===null)!==(b.rack_u===null))throw createError({statusCode:400,statusMessage:'Rack and U must both be set or both empty'})
 if(b.building_id!==null&&b.site_id===null)throw createError({statusCode:400,statusMessage:'Select a site before a building'})
 const c=await db().connect()
 try{
  await c.query('BEGIN')
  const result=await c.query('SELECT * FROM devices WHERE id=$1 FOR UPDATE',[id]);const current=result.rows[0]
  if(!current)throw createError({statusCode:404,statusMessage:'Device not found'})
  await requireCompany(user,Number(current.company_id),true)
  let site=b.site_id,building=b.building_id
  if(b.rack_id!==null){
   const rackResult=await c.query('SELECT r.*,s.company_id FROM racks r JOIN sites s ON s.id=r.site_id WHERE r.id=$1 FOR UPDATE OF r',[b.rack_id]);const rack=rackResult.rows[0]
   if(!rack)throw createError({statusCode:404,statusMessage:'Rack not found'})
   if(Number(rack.company_id)!==Number(current.company_id))throw createError({statusCode:403,statusMessage:'Cannot move a device to another company'})
   site=Number(rack.site_id);building=rack.building_id===null?null:Number(rack.building_id)
   if(b.rack_u!+Number(current.rack_height)-1>Number(rack.height_u))throw createError({statusCode:400,statusMessage:'Device exceeds rack height'})
   const overlap=await c.query('SELECT id FROM devices WHERE id<>$1 AND rack_id=$2 AND rack_u IS NOT NULL AND rack_u<=$3 AND rack_u+rack_height-1 >=$4',[id,b.rack_id,b.rack_u!+Number(current.rack_height)-1,b.rack_u]);
   if(overlap.rowCount)throw createError({statusCode:409,statusMessage:'Rack units occupied'})
  }else{
   if(site!==null){const siteRow=await c.query('SELECT company_id FROM sites WHERE id=$1',[site]);if(!siteRow.rowCount)throw createError({statusCode:404,statusMessage:'Site not found'});if(Number(siteRow.rows[0].company_id)!==Number(current.company_id))throw createError({statusCode:403,statusMessage:'Site belongs to another company'})}
   if(building!==null){const check=await c.query('SELECT id FROM buildings WHERE id=$1 AND site_id=$2',[building,site]);if(!check.rowCount)throw createError({statusCode:400,statusMessage:'Building does not belong to selected site'})}
  }
  const changed=Number(current.site_id??0)!==Number(site??0)||Number(current.building_id??0)!==Number(building??0)||Number(current.rack_id??0)!==Number(b.rack_id??0)||Number(current.rack_u??0)!==Number(b.rack_u??0)||(current.floor??'')!==b.floor||(current.room??'')!==b.room
  if(!changed){await c.query('COMMIT');return {id,unchanged:true}}
  const updated=await c.query('UPDATE devices SET site_id=$1,building_id=$2,rack_id=$3,rack_u=$4,floor=$5,room=$6 WHERE id=$7 RETURNING *',[site,building,b.rack_id,b.rack_u,b.floor,b.room,id])
  await c.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[user.id,'move','device',id])
  await c.query('COMMIT');return updated.rows[0]
 }catch(error){await c.query('ROLLBACK');throw error}finally{c.release()}
})
