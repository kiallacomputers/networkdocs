import { connectionCompany,requireCompany } from '../../utils/companyAccess'
import { requireUser } from '../../utils/auth'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, true)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid connection ID' })
  }
  await requireCompany(user,await connectionCompany(id),true)
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query('DELETE FROM connections WHERE id=$1 RETURNING id', [id])
    if (!result.rowCount) {
      throw createError({ statusCode: 404, statusMessage: 'Connection not found' })
    }
    await client.query(
      'INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',
      [user.id, 'delete', 'connection', id]
    )
    await client.query('COMMIT')
    return { ok: true }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})
