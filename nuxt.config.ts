export default defineNuxtConfig({ 
  compatibilityDate: '2025-07-01', 
  devtools: { 
    enabled: false 
  }, 
  css: ['~/assets/main.css', '~/assets/infravault-brand.css'], 
  runtimeConfig: { 
    databaseUrl: process.env.DATABASE_URL, 
    sessionSecret: process.env.SESSION_SECRET, 
    public: { appName: 'InfraVault' } }, 
  nitro: { preset: 'netlify' } })
