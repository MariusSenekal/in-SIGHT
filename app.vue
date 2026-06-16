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
    { rel: 'shortcut icon', href: `${base}/favicon.ico` }
  ]
})

onMounted(() => {
  startSessionMonitor()
  initTheme()
})
</script>
