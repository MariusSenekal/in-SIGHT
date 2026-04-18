<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>

    <SessionTimeoutModal
      :open="showSessionModal"
      :countdown-label="countdownLabel"
      @stay="stayLoggedIn"
      @logout="logoutFromPrompt"
    />
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

onMounted(() => {
  startSessionMonitor()
  initTheme()
})
</script>
