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
      defaultTheme: 'ocean',
      themes: {
        // ── Light themes ─────────────────────────────────────────────────
        ocean: {
          dark: false,
          colors: {
            primary: '#667eea', secondary: '#764ba2', accent: '#4facfe',
            error: '#f5576c', info: '#00c8ff', success: '#27ae60', warning: '#f093fb'
          }
        },
        forest: {
          dark: false,
          colors: {
            primary: '#2ecc71', secondary: '#1a7a49', accent: '#a3d977',
            error: '#e74c3c', info: '#3498db', success: '#1abc9c', warning: '#f39c12'
          }
        },
        sunset: {
          dark: false,
          colors: {
            primary: '#ff6b6b', secondary: '#feca57', accent: '#fda085',
            error: '#c0392b', info: '#00f2fe', success: '#6ab04c', warning: '#f39c12'
          }
        },
        arctic: {
          dark: false,
          colors: {
            primary: '#0099f7', secondary: '#005bea', accent: '#a8edea',
            error: '#f5576c', info: '#00cfff', success: '#00b894', warning: '#fdcb6e'
          }
        },
        rose: {
          dark: false,
          colors: {
            primary: '#e91e8c', secondary: '#c2185b', accent: '#ff80ab',
            error: '#b71c1c', info: '#1565c0', success: '#2e7d32', warning: '#e65100'
          }
        },
        gold: {
          dark: false,
          colors: {
            primary: '#f0930a', secondary: '#e67e22', accent: '#ffd32a',
            error: '#c0392b', info: '#2980b9', success: '#27ae60', warning: '#d35400'
          }
        },
        // ── Dark themes ───────────────────────────────────────────────────
        midnight: {
          dark: true,
          colors: {
            background: '#0f0f1a', surface: '#1a1a2e',
            primary: '#7c3aed', secondary: '#4f46e5', accent: '#818cf8',
            error: '#f87171', info: '#38bdf8', success: '#4ade80', warning: '#fb923c'
          }
        },
        darkForest: {
          dark: true,
          colors: {
            background: '#0a1a10', surface: '#12261a',
            primary: '#4ade80', secondary: '#22c55e', accent: '#86efac',
            error: '#f87171', info: '#38bdf8', success: '#34d399', warning: '#fbbf24'
          }
        },
        obsidian: {
          dark: true,
          colors: {
            background: '#0f172a', surface: '#1e293b',
            primary: '#94a3b8', secondary: '#64748b', accent: '#cbd5e1',
            error: '#f87171', info: '#60a5fa', success: '#4ade80', warning: '#fbbf24'
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
