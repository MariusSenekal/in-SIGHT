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
          <v-col cols="12" sm="6" md="4" class="d-flex" v-for="module in availableModules" :key="module.key">
            <v-card
              rounded="xl"
              elevation="2"
              :class="['module-card', 'd-flex', 'flex-column', module.locked ? 'module-card--locked' : 'cursor-pointer']"
              @click="module.locked ? null : module.action()"
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

interface ModuleCard {
  key: string
  title: string
  description: string
  iconImg?: string
  icon?: string
  color1: string
  color2: string
  action: () => unknown
  /** Module has no page yet - always listed, always greyed out. */
  notBuilt?: boolean
  /** Card is only shown to admins. */
  adminOnly?: boolean
}

// Order, titles, descriptions and colours mirror https://www.in-sight.app/features
const modules: ModuleCard[] = [
  {
    key: 'clients',
    title: 'Client',
    description: 'Store your client information, contact history, tasks, & service records.',
    iconImg: '/module-icons/clients.svg',
    color1: '#3b82f6',
    color2: '#2563eb',
    action: () => navigateTo('/modules/clients')
  },
  {
    key: 'vehicle',
    title: 'Vehicle',
    description: 'Store mobile asset details (cars, bikes, trucks, golf carts, boats, trailers, caravan, etc.), insurance information & service history ensuring every vehicle is properly managed throughout its lifecycle.',
    iconImg: '/module-icons/vehicle.svg',
    color1: '#f97316',
    color2: '#ea580c',
    action: () => navigateTo('/modules/vehicles')
  },
  {
    key: 'equipment',
    title: 'Equipment',
    description: 'Complete digital record of every piece of equipment your business owns. From equipment information, maintenance history, warranty information, cleaning & service schedules.',
    iconImg: '/module-icons/equipment.svg',
    color1: '#0e7490',
    color2: '#155e75',
    action: () => navigateTo('/modules/equipment')
  },
  {
    key: 'properties',
    title: 'Property',
    description: 'Streamline property operations by managing building information & maintenance history.',
    iconImg: '/module-icons/properties.svg',
    color1: '#7c8b3a',
    color2: '#5f6b2c',
    action: () => {},
    notBuilt: true
  },
  {
    key: 'inventory',
    title: 'Inventory',
    description: 'Simplify stock counting with real-time reconciliation & full tracking.',
    iconImg: '/module-icons/inventory.svg',
    color1: '#ec4899',
    color2: '#db2777',
    action: () => {},
    notBuilt: true
  },
  {
    key: 'suppliers',
    title: 'Vendor',
    description: 'Manage all your suppliers, track their information & keep every vendor relationship organised.',
    iconImg: '/module-icons/suppliers.svg',
    color1: '#14b8a6',
    color2: '#0d9488',
    action: () => {},
    notBuilt: true
  },
  {
    key: 'records',
    title: 'Compliance',
    description: "One platform to manage, track & prove your business' compliance.",
    iconImg: '/module-icons/records.svg',
    color1: '#ef4444',
    color2: '#dc2626',
    action: () => {},
    notBuilt: true
  },
  {
    key: 'hr',
    title: 'Human Resources',
    description: 'Manage your employees from one central place. Store staff records & keep your workforce organised with secure digital profiles.',
    iconImg: '/module-icons/hr.svg',
    color1: '#8b5cf6',
    color2: '#7c3aed',
    action: () => navigateTo('/modules/hr')
  },
  {
    key: 'cleaning',
    title: 'Cleaning',
    description: "Plan, assign, monitor & verify cleaning activities across your entire business. Whether you're managing an office, warehouse, restaurant, school, clinic or multiple sites, every cleaning task is recorded via allocated QR Codes.",
    iconImg: '/module-icons/cleaning.svg',
    color1: '#0d9488',
    color2: '#0f766e',
    action: () => {},  // To be implemented
    notBuilt: true
  },
  {
    key: 'pets',
    title: 'Animal',
    description: "Track every animal's health, identification, breeding, treatments & ownership.",
    iconImg: '/module-icons/pets.svg',
    color1: '#22c55e',
    color2: '#16a34a',
    action: () => {},
    notBuilt: true
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
  }
]

// Every module from the marketing site is always listed so this page mirrors it.
// A card is greyed out (and not clickable) when the module has no page yet, or
// the current user hasn't been granted access to it. QR Codes stays admin-only.
const availableModules = computed(() =>
  modules
    .filter(module => !module.adminOnly || isAdmin.value)
    .map(module => ({
      ...module,
      locked: Boolean(module.notBuilt) || !hasModuleAccess(module.key)
    }))
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
  width: 100%;
  /* Every card matches the tallest: fill the row, with a floor for lone cards */
  height: 100%;
  min-height: 280px;
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
</style>
