<template>
  <SettingsLayout active-tab="theme">
    <v-card rounded="xl" elevation="2">
      <div class="card-top-strip" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-1">
          <v-icon icon="mdi-palette-outline" color="primary" size="24" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">App Theme</h2>
        </div>
        <p class="text-medium-emphasis text-body-2 mb-4">
          Pick a colour theme for the whole app. Your choice is saved automatically.
        </p>

        <!-- Light themes -->
        <p class="text-caption font-weight-bold text-uppercase mb-2" style="letter-spacing:0.08em; opacity:0.6">Light Themes</p>
        <v-row dense class="mb-4">
          <v-col
            v-for="option in lightThemes"
            :key="option.name"
            cols="6" sm="4" md="3"
          >
            <v-card
              rounded="lg"
              class="theme-swatch cursor-pointer"
              :class="{ 'theme-swatch--active': currentThemeName === option.name }"
              :style="currentThemeName === option.name
                ? `outline: 2.5px solid ${option.primary}; outline-offset: 2px; box-shadow: 0 4px 20px ${option.primary}40`
                : ''"
              variant="outlined"
              @click="applyTheme(option.name)"
            >
              <div
                class="theme-swatch__bar"
                :style="`background: linear-gradient(135deg, ${option.primary} 0%, ${option.secondary} 100%)`"
              />
              <v-card-text class="pa-2 pa-sm-3">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-body-2 font-weight-bold">{{ option.emoji }} {{ option.label }}</div>
                  </div>
                  <v-icon
                    v-if="currentThemeName === option.name"
                    icon="mdi-check-circle"
                    :color="option.primary"
                    size="18"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dark themes -->
        <p class="text-caption font-weight-bold text-uppercase mb-2" style="letter-spacing:0.08em; opacity:0.6">Dark Themes</p>
        <v-row dense>
          <v-col
            v-for="option in darkThemes"
            :key="option.name"
            cols="6" sm="4" md="3"
          >
            <v-card
              rounded="lg"
              class="theme-swatch cursor-pointer"
              :class="{ 'theme-swatch--active': currentThemeName === option.name }"
              :style="currentThemeName === option.name
                ? `outline: 2.5px solid ${option.primary}; outline-offset: 2px; box-shadow: 0 4px 20px ${option.primary}40`
                : ''"
              variant="outlined"
              @click="applyTheme(option.name)"
            >
              <div
                class="theme-swatch__bar"
                :style="`background: linear-gradient(135deg, ${option.primary} 0%, ${option.secondary} 100%)`"
              />
              <v-card-text class="pa-2 pa-sm-3">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-body-2 font-weight-bold">{{ option.emoji }} {{ option.label }}</div>
                  </div>
                  <v-icon
                    v-if="currentThemeName === option.name"
                    icon="mdi-check-circle"
                    :color="option.primary"
                    size="18"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const { currentUser, initAuth } = useAuth()
const { currentThemeName, applyTheme, themeOptions } = useAppTheme()

const lightThemes = computed(() => themeOptions.filter(t => !t.dark))
const darkThemes  = computed(() => themeOptions.filter(t => t.dark))

onMounted(() => {
  initAuth()
  if (!currentUser.value) {
    navigateTo('/')
  }
})
</script>

<style scoped>
.card-top-strip {
  height: 3px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  border-radius: 12px 12px 0 0;
}

.theme-swatch__bar {
  height: 48px;
  border-radius: 6px 6px 0 0;
}

.theme-swatch {
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.theme-swatch:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
}

.theme-swatch--active {
  transform: translateY(-2px);
}
</style>
