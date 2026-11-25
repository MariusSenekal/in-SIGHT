<template>
  <SettingsLayout active-tab="profile">
    <v-card rounded="xl" elevation="2">
      <div class="card-top-strip" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-4">
          <v-icon icon="mdi-account-edit-outline" color="primary" size="24" />
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
                prepend-inner-icon="mdi-badge-account-outline"
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
                prepend-inner-icon="mdi-phone-outline"
                maxlength="30"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="profileForm.location"
                label="Site / Room"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-map-marker-outline"
                maxlength="80"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-textarea
                v-model="profileForm.bio"
                label="Bio"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-text"
                rows="2"
                maxlength="180"
              />
            </v-col>
          </v-row>

          <v-btn type="submit" color="primary" prepend-icon="mdi-content-save" size="large" variant="flat" class="mt-1 btn-gradient">
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
      </v-card-text>
    </v-card>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const { currentUser, initAuth, updateProfile } = useAuth()

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

const saveProfile = async () => {
  const result = await updateProfile({
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
.card-top-strip {
  height: 3px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  border-radius: 12px 12px 0 0;
}
</style>
