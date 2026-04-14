<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" md="9" lg="7">
        <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
          <h1 class="text-h4 text-md-h3 font-weight-bold mb-1">Upload Photo</h1>
          <p class="text-medium-emphasis mb-4">Attach visual cleaning proof to your records.</p>

          <v-form @submit.prevent="submitUpload">
            <v-file-input
              label="Choose Photo"
              accept="image/*"
              prepend-icon="mdi-camera"
              variant="outlined"
              @update:model-value="onFileSelected"
            />

            <div class="d-flex flex-wrap ga-2">
              <v-btn type="submit" color="primary" prepend-icon="mdi-upload" :disabled="!selectedFile">Upload Photo</v-btn>
              <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack()">Back to Welcome Page</v-btn>
            </div>
          </v-form>

          <v-alert v-if="message" type="success" variant="tonal" border="start" class="mt-4">{{ message }}</v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const { initAuth } = useAuth()
const { goBack } = useAppNavigation()
const selectedFile = ref<File | null>(null)
const message = ref('')

onMounted(() => {
  initAuth()
})

const onFileSelected = (value: File[] | File | null) => {
  if (Array.isArray(value)) {
    selectedFile.value = value[0] ?? null
  } else {
    selectedFile.value = value
  }

  message.value = ''
}

const submitUpload = () => {
  if (!selectedFile.value) {
    message.value = 'Please select a photo first.'
    return
  }

  message.value = `Photo uploaded successfully: ${selectedFile.value.name}`
  selectedFile.value = null
}

</script>
