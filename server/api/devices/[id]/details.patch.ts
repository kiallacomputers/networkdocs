import { requireCompany,deviceCompany } from '../../../utils/companyAccess'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { db } from '../../../utils/db'

// Rack placement and port provisioning are deliberately managed by separate endpoints.
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  device_type: z.enum(['switch', 'patch_panel', 'server', 'router', 'firewall', 'ups', 'other']),
  manufacturer: z.string().max(120),
  model: z.string().max(120),
  serial: z.string().max(120),
  ip_address: z.string().max(80),
  vlan: z.string().max(80),
  notes: z.string().max(3000)
}).strict()

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, true)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid device ID' })
  }
  await requireCompany(user,await deviceCompany(id),true)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid device details' })
  }
  const body = parsed.data
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const fields = ['name','device_type','manufacturer','model','serial','ip_address','vlan','notes'] as const
    const values = fields.map(field => body[field])
    const current = await client.query(`SELECT ${fields.join(',')} FROM devices WHERE id=$1 FOR UPDATE`, [id])
    if (!current.rows[0]) {
      throw createError({ statusCode: 404, statusMessage: 'Device not found' })
    }
    const changed = fields.some(field => current.rows[0][field] !== body[field])
    if (!changed) {
      await client.query('COMMIT')
      return { id, unchanged: true }
    }
    const assignments = fields.map((field, index) => `${field}=$${index + 1}`).join(',')
    const result = await client.query(`UPDATE devices SET ${assignments} WHERE id=$${fields.length + 1} RETURNING *`, [...values, id])
    await client.query('INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)', [user.id, 'update', 'device', id])
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})
