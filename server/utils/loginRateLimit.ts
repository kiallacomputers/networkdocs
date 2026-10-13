import { createHash } from 'node:crypto'
import { getRequestIP } from 'h3'
import { query } from './db'

const digest = (value: string) => createHash('sha256').update(value).digest('hex')
function limits(event: any, email: string) {
  const ip = getRequestIP(event) || 'unknown'
  return [{ key: 'ip:' + digest(ip), max: 20 }, { key: 'account:' + digest(email), max: 8 }]
}
export async function assertLoginAllowed(event: any, email: string) {
  for (const item of limits(event, email)) {
    const rows = await query("SELECT attempts FROM login_attempts WHERE rate_key=$1 AND window_start > now() - interval '15 minutes'", [item.key])
    if (rows[0] && Number(rows[0].attempts) >= item.max)
      throw createError({ statusCode: 429, statusMessage: 'Too many login attempts. Try again in 15 minutes.' })
  }
}
export async function recordFailedLogin(event: any, email: string) {
  for (const item of limits(event, email)) {
    await query(`INSERT INTO login_attempts(rate_key, attempts, window_start) VALUES($1,1,now())
      ON CONFLICT (rate_key) DO UPDATE SET
      attempts=CASE WHEN login_attempts.window_start <= now()-interval '15 minutes' THEN 1 ELSE login_attempts.attempts+1 END,
      window_start=CASE WHEN login_attempts.window_start <= now()-interval '15 minutes' THEN now() ELSE login_attempts.window_start END`, [item.key])
  }
}
export async function clearAccountFailures(email: string) {
  await query('DELETE FROM login_attempts WHERE rate_key=$1', ['account:' + digest(email)])
}
