<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>

    <ClientOnly>
      <SessionTimeoutModal
        :open="showSessionModal"
        :countdown-label="countdownLabel"
        @stay="stayLoggedIn"
        @logout="logoutFromPrompt"
      />
    </ClientOnly>
  </v-app>
</template>

<script setup lang="ts">
const {
  showSessionModal,
  countdownLabel,
  startSessionMonitor,
  stayLoggedIn,
  logoutFromPrompt
} = useSessionGuard()

const { initTheme } = useAppTheme()

const { app } = useRuntimeConfig()
const base = (app.baseURL as string).replace(/\/$/, '')

useHead({
  link: [
    { rel: 'apple-touch-icon', sizes: '180x180', href: `${base}/icons/apple-touch-icon.png` },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${base}/icons/favicon-32x32.png` },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${base}/icons/favicon-16x16.png` },
    { rel: 'shortcut icon', href: `${base}/favicon.ico` },
    { rel: 'manifest', href: '/manifest.webmanifest' }
  ]
})

// PWA Installation prompt handling
let deferredPrompt: any = null
const installPromptEvent = ref<any>(null)

const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault()
  deferredPrompt = e
  installPromptEvent.value = e
}

const handleAppInstalled = () => {
  console.log('PWA installed successfully')
  deferredPrompt = null
  installPromptEvent.value = null
}

// Fullscreen support
const requestFullscreen = async () => {
  try {
    const element = document.documentElement
    if (element.requestFullscreen) {
      await element.requestFullscreen()
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen()
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen()
    }
  } catch (err) {
    console.log('Fullscreen request failed:', err)
  }
}

// Detect if running as PWA
const isRunningAsPWA = () => {
  return window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         (window.navigator as any).standalone === true
}

// Hide URL bar by scrolling (some mobile browsers)
const hideAddressBar = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 1)
  }
}

onMounted(() => {
  startSessionMonitor()
  initTheme()
  
  // PWA event listeners
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  
  // Hide address bar on mobile
  setTimeout(hideAddressBar, 100)
  
  // Request fullscreen on dashboard if PWA capable
  if (isRunningAsPWA()) {
    setTimeout(() => {
      const currentPath = useRouter().currentRoute.value.path
      if (currentPath.includes('/dashboard')) {
        requestFullscreen().catch(err => console.log('Fullscreen not available'))
      }
    }, 500)
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>
