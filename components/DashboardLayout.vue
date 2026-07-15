<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="10">
        
        <!-- Page header with dynamic title -->
        <v-card rounded="xl" elevation="3" class="mb-4 overflow-hidden">
          <div class="dash-hero">
            <div class="d-flex align-center ga-3" style="position: relative; z-index: 1;">
              <div class="dash-hero__icon">
                <v-icon :icon="pageConfig.icon" size="28" color="white" />
              </div>
              <div>
                <h1 class="text-h5 text-md-h4 font-weight-bold text-white">{{ pageConfig.title }}</h1>
                <p class="text-caption text-white d-none d-sm-block" style="opacity:0.8">{{ pageConfig.description }}</p>
              </div>
            </div>
            <div class="d-flex ga-2 flex-wrap" style="position: relative; z-index: 1;">
              <v-btn color="white" variant="tonal" prepend-icon="mdi-arrow-left" size="small" @click="navigateTo('/')">Back</v-btn>
              <v-btn color="white" variant="outlined" prepend-icon="mdi-logout" size="small" @click="handleLogout">Log Out</v-btn>
            </div>
          </div>
        </v-card>

        <!-- Static Navigation Cards -->
        <v-row dense class="mb-4">
          <v-col cols="6" sm="6" md="3" lg="3" xl="2-4" v-for="item in navigationItems" :key="item.to">
            <v-card 
              :to="item.to" 
              rounded="xl" 
              elevation="2" 
              class="dash-action-card cursor-pointer h-100"
              :class="{ 'dash-action-card--active': isActivePage(item.to) }"
            >
              <div class="dash-action-card__strip" />
              <v-card-text class="pa-3 pa-sm-4">
                <div class="d-flex align-center ga-2 mb-1">
                  <div class="dash-action-card__icon">
                    <v-icon :icon="item.icon" :color="isActivePage(item.to) ? 'primary' : 'primary'" size="20" />
                  </div>
                  <h3 class="text-caption text-sm-subtitle-2 font-weight-bold">{{ item.title }}</h3>
                </div>
                <p class="text-caption text-medium-emphasis d-none d-sm-block">{{ item.description }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dynamic Content Slot -->
        <slot />
        
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout, isAdmin, isClientAdmin } = useAuth()
const managementRoute = computed(() => (isClientAdmin.value ? '/dashboard/client-management' : '/dashboard/management'))

// Navigation items (static across all pages)
const navigationItems = computed(() => [
  {
    to: '/dashboard',
    title: 'Dashboard Home',
    description: 'Overview and quick actions.',
    icon: 'mdi-view-dashboard-outline',
    show: isAdmin.value
  },
  {
    to: managementRoute.value,
    title: 'Management Tools',
    description: isClientAdmin.value ? 'Manage your company users and modules.' : 'Users, companies, and checklists.',
    icon: 'mdi-account-cog-outline',
    show: isAdmin.value || isClientAdmin.value
  },
  {
    to: '/dashboard/qr-codes',
    title: 'QR Code Section',
    description: 'Generate printable QR codes.',
    icon: 'mdi-qrcode',
    show: isAdmin.value
  },
  {
    to: '/dashboard/requests',
    title: 'Service Requests',
    description: 'Review and resolve requests.',
    icon: 'mdi-clipboard-list-outline',
    show: isAdmin.value
  },
  {
    to: '/records',
    title: 'Records Dashboard',
    description: 'All records and tracking.',
    icon: 'mdi-folder-multiple-outline',
    show: isAdmin.value
  }
].filter(item => item.show))

// Page configurations for dynamic header
const pageConfigs: Record<string, { title: string; description: string; icon: string }> = {
  '/dashboard': {
    title: 'Admin Dashboard',
    description: 'Quick cards and checklist tools to manage daily operations.',
    icon: 'mdi-view-dashboard-outline'
  },
  '/dashboard/management': {
    title: 'Management Tools',
    description: 'Manage users, module permissions, companies, QR records and checklists.',
    icon: 'mdi-account-cog-outline'
  },
  '/dashboard/client-management': {
    title: 'Client User Management',
    description: 'Manage your company users and grant module access within your assigned permissions.',
    icon: 'mdi-account-cog-outline'
  },
  '/dashboard/qr-codes': {
    title: 'QR Code Management',
    description: 'Select records, vehicles, or equipment to generate and print QR code sheets.',
    icon: 'mdi-qrcode'
  },
  '/dashboard/requests': {
    title: 'Service Requests',
    description: 'Review maintenance, cleaning and satisfaction feedback from users.',
    icon: 'mdi-clipboard-list-outline'
  },
  '/records': {
    title: 'Records Dashboard',
    description: 'Browse and manage all cleaning records, vehicles, and equipment.',
    icon: 'mdi-folder-multiple-outline'
  }
}

const pageConfig = computed(() => {
  return pageConfigs[route.path] || pageConfigs['/dashboard']
})

const isActivePage = (path: string) => {
  return route.path === path
}

const handleLogout = () => {
  logout()
  navigateTo('/')
}
</script>

<style scoped>
.dash-hero {
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

.dash-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.dash-hero__icon {
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

.dash-action-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dash-action-card__strip {
  height: 0;
  transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dash-action-card--active {
  border: 2px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.dash-action-card--active .dash-action-card__strip {
  height: 4px;
  background: rgb(var(--v-theme-primary));
}

.dash-action-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
