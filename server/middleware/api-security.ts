import { getHeader, getMethod, getRequestURL, setHeader, createError, defineEventHandler } from 'h3'

// Apply to Nitro-rendered pages and API responses; Netlify static files
// receive equivalent headers from netlify.toml.
export default defineEventHandler((event) => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'X-Frame-Options', 'DENY')
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  if (!import.meta.dev) {
    setHeader(event, 'Strict-Transport-Security', 'max-age=31536000')
    setHeader(event, 'Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; upgrade-insecure-requests")
  }

  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return
  setHeader(event, 'Cache-Control', 'no-store')
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(getMethod(event))) return
  const origin = getHeader(event, 'origin')
  const expectedOrigin = getRequestURL(event).origin
  if (origin && origin !== expectedOrigin) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin request denied' })
  }
  if (getHeader(event, 'sec-fetch-site') === 'cross-site') {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request denied' })
  }
})
