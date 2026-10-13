import { getHeader, getMethod, getRequestURL, setHeader, createError, defineEventHandler } from 'h3'

// Reject browser cross-site API mutations before reaching application handlers.
// Non-browser clients without Origin are still subject to normal authentication.
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return

  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(getMethod(event))) return
  const origin = getHeader(event, 'origin')
  const expectedOrigin = getRequestURL(event).origin
  if (origin && origin !== expectedOrigin) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin request denied' })
  }
  const fetchSite = getHeader(event, 'sec-fetch-site')
  if (fetchSite === 'cross-site') {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request denied' })
  }
})
