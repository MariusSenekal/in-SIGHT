<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="10" xl="9">
        
        <!-- Page header with dynamic title -->
        <v-card rounded="xl" elevation="3" class="mb-4 overflow-hidden">
          <div class="module-hero">
            <div class="d-flex align-center ga-3" style="position: relative; z-index: 1;">
              <div class="module-hero__icon">
                <v-icon :icon="icon" size="28" color="white" />
              </div>
              <div>
                <h1 class="text-h5 text-md-h4 font-weight-bold text-white">{{ title }}</h1>
                <p class="text-caption text-white d-none d-sm-block" style="opacity:0.8">{{ description }}</p>
              </div>
            </div>
            <div class="d-flex ga-2 flex-wrap" style="position: relative; z-index: 1;">
              <v-btn color="white" variant="tonal" prepend-icon="mdi-arrow-left" size="small" @click="navigateTo('/modules')">Back</v-btn>
              <v-btn color="white" variant="outlined" prepend-icon="mdi-logout" size="small" @click="handleLogout">Log Out</v-btn>
            </div>
          </div>
        </v-card>

        <!-- Dynamic Content Slot -->
        <slot />
        
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  icon: string
}

defineProps<Props>()

const { logout } = useAuth()

const handleLogout = () => {
  logout()
  navigateTo('/')
}
</script>

<style scoped>
.module-hero {
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

.module-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.module-hero__icon {
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
