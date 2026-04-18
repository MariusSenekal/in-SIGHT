<template>
  <v-container class="py-4 py-md-6">

    <!-- ── Page header ───────────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="4" class="pa-4 pa-md-6 mb-4">
      <div class="d-flex flex-wrap align-center justify-space-between ga-2">
        <div>
          <h1 class="text-h5 text-md-h4 font-weight-bold">My Profile</h1>
          <p class="text-medium-emphasis text-body-2">Manage your account details and personalise the app.</p>
        </div>
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" size="small" @click="goBack()">Back</v-btn>
      </div>
    </v-card>

    <!-- ── Profile details ───────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="4" class="pa-4 pa-md-6 mb-4">
      <div class="d-flex align-center ga-2 mb-4">
        <v-icon icon="mdi-account-circle-outline" color="primary" size="26" />
        <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Profile Details</h2>
      </div>

      <v-form @submit.prevent="saveProfile">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="profileForm.displayName"
              label="Display Name"
              variant="outlined"
              density="comfortable"
              maxlength="60"
              required
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="profileForm.phone"
              label="Phone"
              variant="outlined"
              density="comfortable"
              maxlength="30"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="profileForm.location"
              label="Site / Room"
              variant="outlined"
              density="comfortable"
              maxlength="80"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-textarea
              v-model="profileForm.bio"
              label="Bio"
              variant="outlined"
              density="comfortable"
              rows="2"
              maxlength="180"
            />
          </v-col>
        </v-row>

        <v-btn type="submit" color="primary" prepend-icon="mdi-content-save" size="large" block class="mt-1">
          Save Profile
        </v-btn>
      </v-form>

      <v-alert
        v-if="profileMessage"
        type="success"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mt-3"
      >
        {{ profileMessage }}
      </v-alert>
    </v-card>

    <!-- ── Theme picker ───────────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="4" class="pa-4 pa-md-6">
      <div class="d-flex align-center ga-2 mb-1">
        <v-icon icon="mdi-palette-outline" color="primary" size="26" />
        <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">App Theme</h2>
      </div>
      <p class="text-medium-emphasis text-body-2 mb-4">
        Pick a colour theme for the whole app. Your choice is saved automatically.
      </p>

      <v-row dense>
        <v-col
          v-for="option in themeOptions"
          :key="option.name"
          cols="6" sm="4" md="4"
        >
          <v-card
            rounded="lg"
            class="theme-swatch cursor-pointer"
            :class="{ 'theme-swatch--active': currentThemeName === option.name }"
            :style="currentThemeName === option.name
              ? `outline: 2.5px solid ${option.primary}; outline-offset: 2px`
              : ''"
            variant="outlined"
            @click="applyTheme(option.name)"
          >
            <!-- Gradient colour bar -->
            <div
              class="theme-swatch__bar"
              :style="`background: linear-gradient(135deg, ${option.primary} 40%, ${option.secondary} 100%)`"
            />

            <v-card-text class="pa-2 pa-sm-3">
              <div class="d-flex align-start justify-space-between ga-1">
                <div>
                  <div class="text-body-2 font-weight-bold text-truncate">{{ option.label }}</div>
                  <v-chip
                    size="x-small"
                    :color="option.dark ? 'blue-grey-lighten-1' : 'amber-darken-1'"
                    variant="tonal"
                    class="mt-1"
                  >
                    {{ option.dark ? 'Dark' : 'Light' }}
                  </v-chip>
                </div>
                <v-icon
                  v-if="currentThemeName === option.name"
                  icon="mdi-check-circle"
                  :color="option.primary"
                  size="20"
                  class="mt-1 flex-shrink-0"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

  </v-container>
</template>

<script setup lang="ts">
const { currentUser, initAuth, updateProfile } = useAuth()
const { goBack } = useAppNavigation()
const { currentThemeName, applyTheme, themeOptions } = useAppTheme()

const profileMessage = ref('')

const profileForm = reactive({
  displayName: '',
  phone: '',
  location: '',
  bio: ''
})

onMounted(() => {
  initAuth()

  if (!currentUser.value) {
    navigateTo('/')
    return
  }

  profileForm.displayName = currentUser.value.profile?.displayName || currentUser.value.name
  profileForm.phone = currentUser.value.profile?.phone || ''
  profileForm.location = currentUser.value.profile?.location || ''
  profileForm.bio = currentUser.value.profile?.bio || ''
})

const saveProfile = () => {
  const result = updateProfile({
    displayName: profileForm.displayName,
    phone: profileForm.phone,
    location: profileForm.location,
    bio: profileForm.bio
  })

  profileMessage.value = result.message

  setTimeout(() => { profileMessage.value = '' }, 3000)
}
</script>

<style scoped>
.theme-swatch__bar {
  height: 52px;
  border-radius: 8px 8px 0 0;
}

.theme-swatch {
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.theme-swatch:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
}

.theme-swatch--active {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
}
</style>
