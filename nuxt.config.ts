// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['vuetify']
  },
  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    manifest: {
      name: 'in-SIGHT',
      short_name: 'in-SIGHT',
      description: 'QR-based cleaning records, schedule tracking, and management tools.',
      theme_color: '#1d4ed8',
      background_color: '#ecf4ff',
      display: 'fullscreen',
      display_override: ['fullscreen', 'standalone'],
      orientation: 'portrait-primary',
      scope: '/login/',
      start_url: '/login/',
      icons: [
        {
          src: '/login/icons/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/login/icons/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/login/icons/pwa-maskable-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/login/icons/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/login/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,woff2}']
    },
    client: {
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  },
  app: {
    baseURL: '/login/',
    head: {
      title: 'in-SIGHT - Record Manager',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no' },
        { name: 'theme-color', content: '#1d4ed8' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'in-SIGHT' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'msapplication-TileColor', content: '#1d4ed8' },
        { name: 'msapplication-config', content: '/browserconfig.xml' },
        { name: 'application-name', content: 'in-SIGHT' },
        { name: 'google-site-verification', content: '' }
      ],
      link: [
        { rel: 'icon', href: '/login/icons/pwa-192x192.png' },
        { rel: 'apple-touch-icon', href: '/login/icons/apple-touch-icon.png' },
        { rel: 'manifest', href: '/login/manifest.webmanifest' }
      ]
    }
  },
  nitro: {
    // Ensure socket.io (and its dependencies) are copied into .output/server/node_modules
    // rather than inlined, since it uses dynamic requires that don't bundle cleanly.
    externals: {
      inline: [],
      external: ['socket.io', 'engine.io', 'socket.io-adapter', 'ws']
    }
  },
  runtimeConfig: {
    // Server-only secrets — set via NUXT_JWT_SECRET and NUXT_PGREST_URL env vars
    jwtSecret: '',
    pgrestUrl: '',
    public: {
      siteUrl: 'https://in-sight.app'
    }
  }
})
