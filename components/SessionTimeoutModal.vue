<template>
  <v-dialog
    :model-value="open"
    max-width="460"
    persistent
    role="alertdialog"
    attach="body"
  >
    <v-card rounded="xl" elevation="8">
      <!-- Header stripe -->
      <div class="session-modal-top-bar" />

      <v-card-title class="d-flex align-center justify-space-between pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-clock-alert-outline" color="warning" size="22" />
          <span class="text-h6 font-weight-bold">Session Expiring</span>
        </div>
        <v-chip
          color="error"
          variant="tonal"
          size="small"
          class="font-weight-bold"
        >
          {{ countdownLabel }}
        </v-chip>
      </v-card-title>

      <v-card-text class="pa-5 pt-1 text-body-1">
        You have been inactive. Do you want to stay signed in?
        If the timer reaches zero, you will be logged out automatically.
      </v-card-text>

      <v-card-actions class="pa-5 pt-2">
        <v-spacer />
        <v-btn variant="tonal" color="error" prepend-icon="mdi-logout" @click="$emit('logout')">
          Log Out Now
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-check-circle-outline" @click="$emit('stay')">
          Stay Signed In
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  countdownLabel: string
}>()

defineEmits<{
  stay: []
  logout: []
}>()
</script>

<style scoped>
.session-modal-top-bar {
  height: 4px;
  background: linear-gradient(90deg, rgb(var(--v-theme-warning)) 0%, rgb(var(--v-theme-error)) 100%);
  border-radius: 12px 12px 0 0;
}
</style>
