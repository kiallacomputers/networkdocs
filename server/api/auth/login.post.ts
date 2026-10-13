import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query } from '../../utils/db'
import { newToken, tokenHash } from '../../utils/auth'
import { assertLoginAllowed, recordFailedLogin, clearAccountFailures } from '../../utils/loginRateLimit'

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(1024) })
export default defineEventHandler(async (event) => {
  const body = schema.parse(await readBody(event))
  const email = body.email.trim().toLowerCase()
  await assertLoginAllowed(event, email)
  const rows = await query('SELECT id,email,display_name,role,password_hash FROM users WHERE lower(email)=$1 AND is_active=true', [email])
  const user = rows[0]
  const fallbackHash = '$2b$12$KIXQ4xRk0CHYwJbH4p6E1u3R6gVQb0RkSkG3l6kJYcJjJf9iC5Q8O'
  const valid = await bcrypt.compare(body.password, user?.password_hash || fallbackHash)
  if (!user || !valid) {
    await recordFailedLogin(event, email)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }
  const oldToken = getCookie(event, 'nd_session')
  if (oldToken) await query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash(oldToken)])
  const token = newToken()
  await query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')", [tokenHash(token), user.id])
  setCookie(event, 'nd_session', token, { httpOnly: true, sameSite: 'strict', secure: !import.meta.dev, path: '/', maxAge: 43200 })
  await clearAccountFailures(email)
  return { id: user.id, email: user.email, display_name: user.display_name, role: user.role }
})
