import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#4facfe',
            error: '#f5576c',
            info: '#00f2fe',
            success: '#27ae60',
            warning: '#f093fb'
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
