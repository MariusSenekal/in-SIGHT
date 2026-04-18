import { useTheme } from 'vuetify'

const THEME_KEY = 'insight-app-theme'
const DEFAULT_THEME = 'ocean'

export const themeOptions = [
  { name: 'ocean',      label: 'Ocean',       primary: '#667eea', secondary: '#764ba2', dark: false },
  { name: 'forest',     label: 'Forest',      primary: '#2ecc71', secondary: '#1a7a49', dark: false },
  { name: 'sunset',     label: 'Sunset',      primary: '#ff6b6b', secondary: '#feca57', dark: false },
  { name: 'arctic',     label: 'Arctic',      primary: '#0099f7', secondary: '#005bea', dark: false },
  { name: 'rose',       label: 'Rose',        primary: '#e91e8c', secondary: '#c2185b', dark: false },
  { name: 'gold',       label: 'Gold',        primary: '#f0930a', secondary: '#e67e22', dark: false },
  { name: 'midnight',   label: 'Midnight',    primary: '#7c3aed', secondary: '#4f46e5', dark: true  },
  { name: 'darkForest', label: 'Dark Forest', primary: '#4ade80', secondary: '#22c55e', dark: true  },
  { name: 'obsidian',   label: 'Obsidian',    primary: '#94a3b8', secondary: '#64748b', dark: true  }
] as const

export type ThemeName = typeof themeOptions[number]['name']

export const useAppTheme = () => {
  const theme = useTheme()

  const currentThemeName = useState<string>('appTheme', () => DEFAULT_THEME)

  const applyTheme = (name: string) => {
    theme.global.name.value = name
    currentThemeName.value = name
    if (import.meta.client) {
      localStorage.setItem(THEME_KEY, name)
    }
  }

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem(THEME_KEY) || DEFAULT_THEME
      applyTheme(saved)
    }
  }

  return { currentThemeName, applyTheme, initTheme, themeOptions }
}
