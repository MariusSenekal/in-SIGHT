import { useTheme } from 'vuetify'

const THEME_KEY = 'insight-app-theme'
const DEFAULT_THEME = 'arctic'

export const themeOptions = [
  // Light themes
  { name: 'ocean',      label: 'Ocean',       primary: '#4f46e5', secondary: '#7c3aed', dark: false, emoji: '🌊' },
  { name: 'teal',       label: 'Teal',        primary: '#0d9488', secondary: '#0891b2', dark: false, emoji: '🩵' },
  { name: 'slate',      label: 'Slate',       primary: '#475569', secondary: '#334155', dark: false, emoji: '🪨' },
  { name: 'forest',     label: 'Forest',      primary: '#16a34a', secondary: '#15803d', dark: false, emoji: '🌿' },
  { name: 'arctic',     label: 'Arctic',      primary: '#0284c7', secondary: '#0369a1', dark: false, emoji: '❄️' },
  { name: 'sunset',     label: 'Sunset',      primary: '#ea580c', secondary: '#dc2626', dark: false, emoji: '🌅' },
  { name: 'rose',       label: 'Rose',        primary: '#e11d48', secondary: '#be185d', dark: false, emoji: '🌸' },
  { name: 'amber',      label: 'Amber',       primary: '#d97706', secondary: '#b45309', dark: false, emoji: '🍂' },
  { name: 'gold',       label: 'Gold',        primary: '#ca8a04', secondary: '#a16207', dark: false, emoji: '✨' },
  // Dark themes
  { name: 'midnight',   label: 'Midnight',    primary: '#818cf8', secondary: '#a78bfa', dark: true,  emoji: '🌙' },
  { name: 'carbon',     label: 'Carbon',      primary: '#60a5fa', secondary: '#3b82f6', dark: true,  emoji: '⚫' },
  { name: 'darkForest', label: 'Dark Forest', primary: '#4ade80', secondary: '#22d3ee', dark: true,  emoji: '🌲' },
  { name: 'obsidian',   label: 'Obsidian',    primary: '#94a3b8', secondary: '#6366f1', dark: true,  emoji: '💎' },
  { name: 'crimson',    label: 'Crimson',     primary: '#fb7185', secondary: '#f43f5e', dark: true,  emoji: '🔴' },
] as const

export type ThemeName = typeof themeOptions[number]['name']

export const useAppTheme = () => {
  const theme = useTheme()

  const currentThemeName = useState<string>('appTheme', () => DEFAULT_THEME)

  const applyTheme = async (name: string, saveToServer: boolean = true) => {
    theme.change(name)
    currentThemeName.value = name
    if (import.meta.client) {
      localStorage.setItem(THEME_KEY, name)
      
      // Save to user profile if logged in
      if (saveToServer) {
        try {
          await $fetch('/api/profile/theme', {
            method: 'PATCH',
            body: { theme: name }
          })
        } catch (error) {
          // Silently fail if not authenticated or server error
          console.warn('Could not save theme to profile:', error)
        }
      }
    }
  }

  const initTheme = (userTheme?: string) => {
    if (import.meta.client) {
      // Priority: user profile theme > localStorage > default
      const themeToApply = userTheme || localStorage.getItem(THEME_KEY) || DEFAULT_THEME
      applyTheme(themeToApply, false) // Don't save to server during init
    }
  }

  return { currentThemeName, applyTheme, initTheme, themeOptions }
}
