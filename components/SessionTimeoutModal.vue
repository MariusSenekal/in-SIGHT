<template>
  <transition name="session-modal-fade">
    <div v-if="open" class="session-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="session-modal-title">
      <div class="session-modal-card">
        <div class="session-modal-header">
          <h2 id="session-modal-title">Session Expiring</h2>
          <span class="session-modal-chip">{{ countdownLabel }}</span>
        </div>

        <p>
          You have been inactive. Do you want to stay signed in?
          If the timer reaches zero, you will be logged out automatically.
        </p>

        <div class="session-modal-actions">
          <button type="button" class="ghost-btn" @click="$emit('logout')">
            Log Out Now
          </button>
          <button type="button" class="primary-btn" @click="$emit('stay')">
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  </transition>
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
