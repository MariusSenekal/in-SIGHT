<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="9" xl="8">
        
        <!-- Page header -->
        <div class="d-flex align-center mb-5">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="navigateTo('/')"
            class="mr-2"
          />
          <div>
            <h1 class="text-h4 font-weight-bold">Modules</h1>
            <p class="text-medium-emphasis mb-0">Select a tracking module to manage</p>
          </div>
        </div>

        <!-- Module cards grid -->
        <v-row dense>
          <v-col cols="12" sm="6" md="4" v-for="module in modules" :key="module.key">
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
    key: 'equipment',
    title: 'Equipment',
    description: 'Manage equipment inventory, maintenance schedules, and tracking.',
    icon: 'mdi-toolbox',
    color1: '#f59e0b',
    color2: '#d97706',
    action: () => {}  // To be implemented
  },
  {
    key: 'cleaning',
    title: 'Cleaning',
    description: 'Monitor cleaning schedules, checklists, and quality standards.',
    icon: 'mdi-spray-bottle',
    color1: '#10b981',
    color2: '#059669',
    action: () => {}  // To be implemented
  }
]
</script>

<style scoped>
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
