import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { requireCompany } from '../../utils/companyAccess'
import { db } from '../../utils/db'

const schema = z.object({
  company_id:z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).default('')
}).strict()

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, true)
  const body = schema.parse(await readBody(event))
  await requireCompany(user,body.company_id,true)
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'INSERT INTO sites(name,description,company_id) VALUES($1,$2,$3) RETURNING *',
      [body.name, body.description,body.company_id]
    )
    const site = result.rows[0]
    await client.query(
      'INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',
      [user.id, 'create', 'site', site.id]
    )
    await client.query('COMMIT')
    return site
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})
