import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { requireCompany, siteCompany } from '../../utils/companyAccess'
import { db } from '../../utils/db'

const schema = z.object({
  site_id: z.coerce.number().int().positive(),
  building_id: z.number().int().positive().nullable(),
  name: z.string().trim().min(1).max(120),
  height_u: z.coerce.number().int().min(1).max(60),
  location: z.string().max(200)
}).strict()

export default defineEventHandler(async event => {
  const user = await requireUser(event, true)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) throw createError({statusCode:400,statusMessage:'Invalid rack'})
  const body = schema.parse(await readBody(event))
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query('SELECT r.site_id,s.company_id FROM racks r JOIN sites s ON s.id=r.site_id WHERE r.id=$1 FOR UPDATE OF r',[id])
    if (!existing.rowCount) throw createError({statusCode:404,statusMessage:'Rack not found'})
    const oldCompany = existing.rows[0].company_id === null ? null : Number(existing.rows[0].company_id)
    const newCompany = await siteCompany(body.site_id)
    await requireCompany(user, oldCompany, true)
    await requireCompany(user, newCompany, true)
    if (oldCompany !== newCompany) throw createError({statusCode:400,statusMessage:'Cannot move a rack between companies. Move devices individually first.'})
    if (body.building_id !== null) {
      const building = await client.query('SELECT id FROM buildings WHERE id=$1 AND site_id=$2',[body.building_id,body.site_id])
      if (!building.rowCount) throw createError({statusCode:400,statusMessage:'Building does not belong to selected site'})
    }
    const occupied = await client.query('SELECT COALESCE(MAX(rack_u + rack_height - 1),0) AS highest_u FROM devices WHERE rack_id=$1',[id])
    if (Number(occupied.rows[0].highest_u)>body.height_u) throw createError({statusCode:400,statusMessage:'Rack height is too small for installed devices'})
    const result = await client.query('UPDATE racks SET site_id=$1,building_id=$2,name=$3,height_u=$4,location=$5 WHERE id=$6 RETURNING *',[body.site_id,body.building_id,body.name,body.height_u,body.location,id])
    await client.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[user.id,'update','rack',id])
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
})
