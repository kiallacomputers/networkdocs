import { requireUser } from './auth'
export async function requireAdmin(event: any) {
  const user = await requireUser(event)
  if (user.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Administrator access required' })
  return user
}
