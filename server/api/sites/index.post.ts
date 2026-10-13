import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { db } from '../../utils/db'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).default('')
}).strict()

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, true)
  const body = schema.parse(await readBody(event))
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'INSERT INTO sites(name,description) VALUES($1,$2) RETURNING *',
      [body.name, body.description]
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
