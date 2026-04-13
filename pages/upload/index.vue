<template>
  <div class="container simple-panel">
    <h1>Upload Photo</h1>
    <p>
      Select and upload cleaning photos to attach visual proof to your records.
    </p>

    <form class="upload-form" @submit.prevent="submitUpload">
      <label class="upload-input">
        <span>Choose Photo</span>
        <input type="file" accept="image/*" @change="onFileSelected" required />
      </label>

      <button type="submit" class="primary-btn" :disabled="!selectedFile">
        Upload Photo
      </button>
    </form>

    <p v-if="message" class="form-message">{{ message }}</p>

    <button
      v-if="isAdmin"
      type="button"
      class="back-button"
      style="margin-top: 25px;"
      @click="goBackToAdmin"
    >
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Back to Admin Area
    </button>
    <NuxtLink v-else to="/" class="back-button" style="margin-top: 25px;">Back Home</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { isAdmin, initAuth } = useAuth()
const selectedFile = ref<File | null>(null)
const message = ref('')

onMounted(() => {
  initAuth()
})

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
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

const goBackToAdmin = () => {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }

  navigateTo('/dashboard')
}
</script>
