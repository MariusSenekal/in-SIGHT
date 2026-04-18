// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['vuetify']
  },
  experimental: {
    inlineSSRStyles: false
  },
  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    manifest: {
      name: 'in-SIGHT Cleaning Medic',
      short_name: 'in-SIGHT',
      description: 'QR-based cleaning records, schedule tracking, and management tools.',
      theme_color: '#1d4ed8',
      background_color: '#ecf4ff',
      display: 'standalone',
      display_override: ['fullscreen', 'standalone', 'minimal-ui'],
      orientation: 'portrait',
      scope: '/login/',
      start_url: '/login/',
      icons: [
        {
          src: '/login/icons/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/login/icons/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,woff2}']
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  },
  app: {
    baseURL: '/login/',
    head: {
      title: 'in-SIGHT - Record Manager',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#1d4ed8' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/login/icons/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', href: '/login/icons/pwa-192x192.png' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      siteUrl: 'https://in-sight.app'
    }
  }
})
