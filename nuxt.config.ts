export default defineNuxtConfig({ 
  compatibilityDate: '2025-07-01', 
  devtools: { 
    enabled: false 
  }, 
  css: ['~/assets/main.css'], 
  runtimeConfig: { 
    databaseUrl: process.env.DATABASE_URL, 
    sessionSecret: process.env.SESSION_SECRET, 
    public: { appName: 'NetworkDocs' } }, 
  nitro: { preset: 'netlify' } })
