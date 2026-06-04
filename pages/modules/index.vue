<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="9" xl="8">
        
        <!-- Page header with gradient -->
        <v-card rounded="xl" elevation="3" class="mb-4 overflow-hidden">
          <div class="modules-hero">
            <div class="d-flex align-center ga-3" style="position: relative; z-index: 1;">
              <div class="modules-hero__icon">
                <v-icon icon="mdi-view-grid-outline" size="28" color="white" />
              </div>
              <div>
                <h1 class="text-h5 text-md-h4 font-weight-bold text-white">Modules</h1>
                <p class="text-caption text-white d-none d-sm-block" style="opacity:0.8">Select a tracking module to manage</p>
              </div>
            </div>
            <div class="d-flex ga-2 flex-wrap" style="position: relative; z-index: 1;">
              <v-btn color="white" variant="tonal" prepend-icon="mdi-arrow-left" size="small" @click="navigateTo('/')">Back</v-btn>
              <v-btn color="white" variant="outlined" prepend-icon="mdi-logout" size="small" @click="handleLogout">Log Out</v-btn>
            </div>
          </div>
        </v-card>

        <!-- Module cards grid -->
        <v-row dense>
          <v-col cols="12" sm="6" md="4" v-for="module in availableModules" :key="module.key">
            <v-card
              rounded="xl"
              elevation="2"
              class="module-card cursor-pointer"
              @click="module.action()"
            >
              <div 
                class="module-card__strip" 
                :style="`background: linear-gradient(90deg, ${module.color1} 0%, ${module.color2} 100%)`" 
              />
              <v-card-text class="pa-5">
                <div class="d-flex align-center ga-3 mb-2">
                  <div 
                    class="module-card__icon" 
                    :style="`background: linear-gradient(135deg, ${module.color1} 0%, ${module.color2} 100%)`"
                  >
                    <v-icon :icon="module.icon" color="white" size="28" />
                  </div>
                  <h3 class="text-h6 font-weight-bold">{{ module.title }}</h3>
                </div>
                <p class="text-body-2 text-medium-emphasis">{{ module.description }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const { isAdmin, logout } = useAuth()

const handleLogout = () => {
  logout()
  navigateTo('/')
}

const modules = [
  {
    key: 'vehicle',
    title: 'Vehicle',
    description: 'Track vehicle information, maintenance, and service history.',
    icon: 'mdi-car',
    color1: '#3b82f6',
    color2: '#2563eb',
    action: () => navigateTo('/modules/vehicles')
  },
  {
    key: 'qr-codes',
    title: 'QR Codes',
    description: 'Generate and print QR codes for your records and assets.',
    icon: 'mdi-qrcode',
    color1: '#8b5cf6',
    color2: '#7c3aed',
    action: () => navigateTo('/modules/qr-codes'),
    adminOnly: true  // Only admins can access QR codes module
  },
  {
    key: 'equipment',
    title: 'Equipment',
    description: 'Manage equipment inventory, maintenance schedules, and tracking.',
    icon: 'mdi-toolbox',
    color1: '#f59e0b',
    color2: '#d97706',
    action: () => navigateTo('/modules/equipment')
  },
  {
    key: 'cleaning',
    title: 'Cleaning',
    description: 'Monitor cleaning schedules, checklists, and quality standards.',
    icon: 'mdi-spray-bottle',
    color1: '#10b981',
    color2: '#059669',
    action: () => {}  // To be implemented
  },
  {
    key: 'clients',
    title: 'Clients',
    description: 'Manage client information and relationships.',
    icon: 'mdi-account-tie',
    color1: '#0ea5e9',
    color2: '#0284c7',
    action: () => navigateTo('/modules/clients')
  },
  {
    key: 'hr',
    title: 'HR',
    description: 'Manage staff information and records.',
    icon: 'mdi-account-group',
    color1: '#8b5cf6',
    color2: '#6d28d9',
    action: () => navigateTo('/modules/hr')
  }
]

// Filter modules based on user role - only show admin-only modules to admins
const availableModules = computed(() => 
  modules.filter(module => !module.adminOnly || isAdmin.value)
)
</script>

<style scoped>
.modules-hero {
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

.modules-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.modules-hero__icon {
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

.module-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.module-card__strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.module-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
