import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { siteCompany,requireCompany } from '../../utils/companyAccess'
import { db } from '../../utils/db'

const schema = z.object({
  site_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  height_u: z.coerce.number().int().min(1).max(60),
  location: z.string().max(200).default(''),
  building_id: z.coerce.number().int().positive().nullable().default(null)
}).strict()

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, true)
  const body = schema.parse(await readBody(event))
  await requireCompany(user,await siteCompany(body.site_id),true)
  if(body.building_id!==null){
    const {query}=await import('../../utils/db')
    const matches=await query('SELECT id FROM buildings WHERE id=$1 AND site_id=$2',[body.building_id,body.site_id])
    if(!matches.length)throw createError({statusCode:400,statusMessage:'Building does not belong to selected site'})
  }
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'INSERT INTO racks(site_id,name,height_u,location,building_id) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [body.site_id, body.name, body.height_u, body.location,body.building_id]
    )
    const rack = result.rows[0]
    await client.query(
      'INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',
      [user.id, 'create', 'rack', rack.id]
    )
    await client.query('COMMIT')
    return rack
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})
