import pg from 'pg'
let pool: pg.Pool | undefined
export function db(){if(!pool){const url=useRuntimeConfig().databaseUrl;if(!url)throw createError({statusCode:500,statusMessage:'Database not configured'});pool=new pg.Pool({connectionString:url,max:12})}return pool}
export async function query(sql:string,params:unknown[]=[]){return (await db().query(sql,params)).rows}
