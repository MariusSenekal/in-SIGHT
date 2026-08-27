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
              :class="['module-card', module.locked ? 'module-card--locked' : 'cursor-pointer']"
              @click="module.locked ? null : module.action()"
            >
              <div
                class="module-card__strip"
                :style="`background: linear-gradient(90deg, ${module.color1} 0%, ${module.color2} 100%)`"
              />
              <span v-if="module.locked" class="module-card__badge">Coming Soon</span>
              <v-card-text class="pa-5">
                <div class="d-flex align-center ga-3 mb-2">
                  <div
                    class="module-card__icon"
                    :style="`background: linear-gradient(135deg, ${module.color1} 0%, ${module.color2} 100%)`"
                  >
                    <img v-if="module.iconImg" :src="module.iconImg" alt="" class="module-card__icon-img" />
                    <v-icon v-else :icon="module.icon" color="white" size="28" />
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

const { isAdmin, hasModuleAccess, logout } = useAuth()

const handleLogout = () => {
  logout()
  navigateTo('/')
}

const modules = [
  {
    key: 'vehicle',
    title: 'Vehicle',
    description: 'Track vehicle information, maintenance, and service history.',
    iconImg: '/module-icons/vehicle.svg',
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
    iconImg: '/module-icons/equipment.svg',
    color1: '#f59e0b',
    color2: '#d97706',
    action: () => navigateTo('/modules/equipment')
  },
  {
    key: 'cleaning',
    title: 'Cleaning',
    description: 'Monitor cleaning schedules, checklists, and quality standards.',
    iconImg: '/module-icons/cleaning.svg',
    color1: '#10b981',
    color2: '#059669',
    action: () => {},  // To be implemented
    locked: true
  },
  {
    key: 'clients',
    title: 'Clients',
    description: 'Manage client information and relationships.',
    iconImg: '/module-icons/clients.svg',
    color1: '#0ea5e9',
    color2: '#0284c7',
    action: () => navigateTo('/modules/clients')
  },
  {
    key: 'hr',
    title: 'HR',
    description: 'Manage staff information and records.',
    iconImg: '/module-icons/hr.svg',
    color1: '#8b5cf6',
    color2: '#6d28d9',
    action: () => navigateTo('/modules/hr')
  },
  // Not yet built - shown for visibility but unaccessible, same treatment as Cleaning
  {
    key: 'properties',
    title: 'Properties',
    description: 'Manage properties, sites, and service locations.',
    iconImg: '/module-icons/properties.svg',
    color1: '#6366f1',
    color2: '#4f46e5',
    action: () => {},
    locked: true,
    comingSoon: true
  },
  {
    key: 'inventory',
    title: 'Inventory',
    description: 'Track cleaning supplies, stock levels, and reordering.',
    iconImg: '/module-icons/inventory.svg',
    color1: '#ec4899',
    color2: '#db2777',
    action: () => {},
    locked: true,
    comingSoon: true
  },
  {
    key: 'records',
    title: 'Records & Compliance',
    description: 'Manage compliance documents, certificates, and records.',
    iconImg: '/module-icons/records.svg',
    color1: '#ef4444',
    color2: '#dc2626',
    action: () => {},
    locked: true,
    comingSoon: true
  },
  {
    key: 'suppliers',
    title: 'Suppliers',
    description: 'Manage suppliers and vendor relationships.',
    iconImg: '/module-icons/suppliers.svg',
    color1: '#14b8a6',
    color2: '#0d9488',
    action: () => {},
    locked: true,
    comingSoon: true
  },
  {
    key: 'pets',
    title: 'Pet Care',
    description: 'Track pet-friendly service requirements for client properties.',
    iconImg: '/module-icons/pets.svg',
    color1: '#84cc16',
    color2: '#65a30d',
    action: () => {},
    locked: true,
    comingSoon: true
  }
]

// Filter modules based on user role and permissions
const availableModules = computed(() =>
  modules.filter(module => {
    // Not-yet-built modules are shown to everyone as a locked preview -
    // there's nothing to gate access to yet.
    if (module.comingSoon) {
      return true
    }

    // Admin-only modules require admin role
    if (module.adminOnly && !isAdmin.value) {
      return false
    }

    // Check if user has access to this specific module
    return hasModuleAccess(module.key)
  })
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

.module-card__icon-img {
  width: 46px;
  height: 46px;
  filter: brightness(0) invert(1); /* render source SVG as solid white */
}

.cursor-pointer {
  cursor: pointer;
}

.module-card--locked {
  cursor: not-allowed;
}

.module-card--locked:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.module-card--locked .module-card__strip,
.module-card--locked .module-card__icon {
  filter: grayscale(65%);
  opacity: 0.55;
}

.module-card--locked .text-h6,
.module-card--locked .text-body-2 {
  opacity: 0.55;
}

.module-card__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  background: rgba(var(--v-theme-surface), 0.92);
  color: rgba(var(--v-theme-on-surface), 0.7);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 999px;
}
</style>
