<template>
  <v-container class="py-4 py-md-6">

    <!-- ── Page hero header ───────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="3" class="mb-4 overflow-hidden">
      <div class="settings-hero">
        <div class="d-flex align-center ga-3" style="position: relative; z-index: 1;">
          <div class="settings-hero__icon">
            <v-icon icon="mdi-cog-outline" size="28" color="white" />
          </div>
          <div>
            <h1 class="text-h5 text-md-h4 font-weight-bold text-white">Settings</h1>
            <p class="text-caption text-white d-none d-sm-block" style="opacity:0.8">Manage your account, theme and notifications.</p>
          </div>
        </div>
        <v-btn
          color="white"
          variant="tonal"
          prepend-icon="mdi-arrow-left"
          size="small"
          style="position: relative; z-index: 1;"
          @click="navigateTo('/')"
        >Back</v-btn>
      </div>

      <!-- ── Settings tab nav ───────────────────────────────────────────── -->
      <v-tabs :model-value="activeTab" bg-color="surface" color="primary" grow density="comfortable" @update:model-value="go">
        <v-tab value="profile" prepend-icon="mdi-account-outline" to="/settings/profile">My Profile</v-tab>
        <v-tab value="theme" prepend-icon="mdi-palette-outline" to="/settings/theme">Theme</v-tab>
        <v-tab value="notifications" prepend-icon="mdi-bell-outline" to="/settings/notifications">Notifications</v-tab>
      </v-tabs>
    </v-card>

    <!-- ── Tab content ────────────────────────────────────────────────── -->
    <slot />

  </v-container>
</template>

<script setup lang="ts">
interface Props {
  activeTab: 'profile' | 'theme' | 'notifications'
}

defineProps<Props>()

const go = (value: unknown) => {
  if (typeof value === 'string') navigateTo(`/settings/${value}`)
}
</script>

<style scoped>
.settings-hero {
  position: relative;
  overflow: hidden;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.settings-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.settings-hero__icon {
  position: relative;
  z-index: 1;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
