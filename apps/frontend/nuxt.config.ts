// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    // Private (server-only SSR) - diisi otomatis via Vercel service binding BACKEND_URL
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    public: {
      // Public (browser client) - default ke /api (same-origin Vercel rewrite) atau port dev lokal
      apiBase: process.env.NUXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api'),
    },
  },
  app: {
    head: {
      title: 'urunankita - Community Billing & Bookkeeping',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
        },
      ],
    },
  },
})
