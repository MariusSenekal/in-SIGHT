// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['vuetify']
  },
  app: {
    head: {
      title: 'IClean - Record Manager',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
