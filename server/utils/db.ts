import pg from 'pg'

let pool: pg.Pool | undefined

export function db() {
  if (!pool) {
    const config = useRuntimeConfig()
    const url = config.databaseUrl

    if (!url) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not configured'
      })
    }

    const ca = process.env.POSTGRES_SSL_CA

    pool = new pg.Pool({
      connectionString: url,
      max: 12,
      ...(ca
        ? {
            ssl: {
              ca: ca.replace(/\\n/g, '\n'),
              rejectUnauthorized: true
            }
          }
        : {})
    })
  }

  return pool
}

export async function query(
  sql: string,
  params: unknown[] = []
) {
  return (await db().query(sql, params)).rows
}
