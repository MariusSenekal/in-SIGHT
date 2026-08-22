import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    defaults: {
      VBtn: { style: 'letter-spacing: 0.02em; font-weight: 600;' },
      VTextField: { variant: 'outlined' },
      VSelect: { variant: 'outlined' },
      VTextarea: { variant: 'outlined' },
    },
    theme: {
      defaultTheme: 'inSight',
      themes: {
        // ── Brand default (matches in-SIGHT mockups) ────────────────────────
        inSight: {
          dark: false,
          colors: {
            background: '#ffffff',
            surface: '#ffffff',
            'surface-variant': '#eef0f7',
            primary: '#04045d',
            secondary: '#000a3f',
            accent: '#000a3f',
            error: '#ef4444',
            info: '#04045d',
            success: '#22c55e',
            warning: '#f59e0b',
            'on-background': '#04045d',
            'on-surface': '#04045d',
            'on-primary': '#ffffff',
            'on-secondary': '#ffffff',
            'on-accent': '#ffffff',
            'on-info': '#ffffff',
          }
        },
        // ── Light themes ──────────────────────────────────────────────────
        ocean: {
          dark: false,
          colors: {
            background: '#eef2ff',
            surface: '#ffffff',
            primary: '#4f46e5',
            secondary: '#7c3aed',
            accent: '#06b6d4',
            error: '#ef4444',
            info: '#0ea5e9',
            success: '#10b981',
            warning: '#f59e0b',
            'on-surface': '#1e1b4b',
          }
        },
        teal: {
          dark: false,
          colors: {
            background: '#f0fdfa',
            surface: '#ffffff',
            primary: '#0d9488',
            secondary: '#0891b2',
            accent: '#34d399',
            error: '#ef4444',
            info: '#0ea5e9',
            success: '#10b981',
            warning: '#f59e0b',
            'on-surface': '#134e4a',
          }
        },
        slate: {
          dark: false,
          colors: {
            background: '#f8fafc',
            surface: '#ffffff',
            primary: '#475569',
            secondary: '#334155',
            accent: '#6366f1',
            error: '#ef4444',
            info: '#0ea5e9',
            success: '#10b981',
            warning: '#f59e0b',
            'on-surface': '#0f172a',
          }
        },
        forest: {
          dark: false,
          colors: {
            background: '#f0fdf4',
            surface: '#ffffff',
            primary: '#16a34a',
            secondary: '#15803d',
            accent: '#84cc16',
            error: '#ef4444',
            info: '#0ea5e9',
            success: '#22c55e',
            warning: '#f59e0b',
            'on-surface': '#14532d',
          }
        },
        sunset: {
          dark: false,
          colors: {
            background: '#fff7ed',
            surface: '#ffffff',
            primary: '#ea580c',
            secondary: '#dc2626',
            accent: '#f59e0b',
            error: '#991b1b',
            info: '#0ea5e9',
            success: '#16a34a',
            warning: '#d97706',
            'on-surface': '#431407',
          }
        },
        arctic: {
          dark: false,
          colors: {
            background: '#f0f9ff',
            surface: '#ffffff',
            primary: '#0284c7',
            secondary: '#0369a1',
            accent: '#67e8f9',
            error: '#ef4444',
            info: '#0ea5e9',
            success: '#10b981',
            warning: '#f59e0b',
            'on-surface': '#0c4a6e',
          }
        },
        rose: {
          dark: false,
          colors: {
            background: '#fff1f2',
            surface: '#ffffff',
            primary: '#e11d48',
            secondary: '#be185d',
            accent: '#f43f5e',
            error: '#9f1239',
            info: '#0ea5e9',
            success: '#10b981',
            warning: '#f59e0b',
            'on-surface': '#4c0519',
          }
        },
        amber: {
          dark: false,
          colors: {
            background: '#fffbeb',
            surface: '#ffffff',
            primary: '#d97706',
            secondary: '#b45309',
            accent: '#fbbf24',
            error: '#ef4444',
            info: '#0ea5e9',
            success: '#10b981',
            warning: '#92400e',
            'on-surface': '#451a03',
          }
        },
        gold: {
          dark: false,
          colors: {
            background: '#fefce8',
            surface: '#ffffff',
            primary: '#ca8a04',
            secondary: '#a16207',
            accent: '#facc15',
            error: '#ef4444',
            info: '#0ea5e9',
            success: '#10b981',
            warning: '#854d0e',
            'on-surface': '#422006',
          }
        },
        // ── Dark themes ───────────────────────────────────────────────────
        midnight: {
          dark: true,
          colors: {
            background: '#09090f',
            surface: '#13131f',
            'surface-variant': '#1e1e30',
            primary: '#818cf8',
            secondary: '#a78bfa',
            accent: '#38bdf8',
            error: '#f87171',
            info: '#38bdf8',
            success: '#4ade80',
            warning: '#fb923c',
            'on-surface': '#e2e8f0',
          }
        },
        carbon: {
          dark: true,
          colors: {
            background: '#0a0a0a',
            surface: '#111111',
            'surface-variant': '#1a1a1a',
            primary: '#60a5fa',
            secondary: '#3b82f6',
            accent: '#93c5fd',
            error: '#f87171',
            info: '#38bdf8',
            success: '#4ade80',
            warning: '#fbbf24',
            'on-surface': '#f1f5f9',
          }
        },
        darkForest: {
          dark: true,
          colors: {
            background: '#071309',
            surface: '#0f2112',
            'surface-variant': '#162e1a',
            primary: '#4ade80',
            secondary: '#22d3ee',
            accent: '#86efac',
            error: '#f87171',
            info: '#38bdf8',
            success: '#34d399',
            warning: '#fbbf24',
            'on-surface': '#dcfce7',
          }
        },
        obsidian: {
          dark: true,
          colors: {
            background: '#0b0f1a',
            surface: '#141928',
            'surface-variant': '#1c2235',
            primary: '#94a3b8',
            secondary: '#7c8fa8',
            accent: '#6366f1',
            error: '#f87171',
            info: '#60a5fa',
            success: '#4ade80',
            warning: '#fbbf24',
            'on-surface': '#e2e8f0',
          }
        },
        crimson: {
          dark: true,
          colors: {
            background: '#0f0306',
            surface: '#1a0509',
            'surface-variant': '#240810',
            primary: '#fb7185',
            secondary: '#f43f5e',
            accent: '#fda4af',
            error: '#f87171',
            info: '#38bdf8',
            success: '#4ade80',
            warning: '#fbbf24',
            'on-surface': '#ffe4e6',
          }
        },
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
