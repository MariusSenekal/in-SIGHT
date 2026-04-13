<template>
  <div class="container">
    <div class="header">
      <h1>in-SIGHT Records</h1>
      <p>View and manage your cleaning records</p>
      <button
        v-if="isAdmin"
        type="button"
        class="back-button"
        style="margin-top: 16px;"
        @click="goBackToAdmin"
      >
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Back to Admin Area
      </button>
    </div>

    <section v-if="isAdmin" class="simple-panel add-record-panel">
      <h2>Add Record</h2>
      <p>Create a new record with its own unique QR code identifier.</p>

      <form class="manual-form" @submit.prevent="submitRecord">
        <label>
          Record Name
          <input v-model="recordForm.name" type="text" required />
        </label>

        <label>
          Type
          <input v-model="recordForm.type" type="text" required />
        </label>

        <label>
          Location
          <input v-model="recordForm.location" type="text" required />
        </label>

        <label>
          Description
          <input v-model="recordForm.description" type="text" required />
        </label>

        <button type="submit" class="primary-btn">
          <span class="material-symbols-outlined" aria-hidden="true">add</span>
          Add Record
        </button>
      </form>

      <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
    </section>

    <div class="records-grid">
      <NuxtLink
        v-for="record in records"
        :key="record.id"
        :to="`/record/${record.id}`"
        class="record-card"
      >
        <h2>{{ record.name }}</h2>
        <p><strong>Code:</strong> {{ record.code }}</p>
        <p>{{ record.description }}</p>
        <p><strong>Location:</strong> {{ record.location }}</p>
        <span class="type">{{ record.type }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { isAdmin, initAuth } = useAuth()
const { getRecords, addRecord } = useRecords()
const records = getRecords()
const formMessage = ref('')

const recordForm = reactive({
  name: '',
  type: '',
  location: '',
  description: ''
})

onMounted(() => {
  initAuth()
})

const goBackToAdmin = () => {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }

  navigateTo('/dashboard')
}

const submitRecord = () => {
  const created = addRecord({
    name: recordForm.name.trim(),
    type: recordForm.type.trim(),
    location: recordForm.location.trim(),
    description: recordForm.description.trim()
  })

  recordForm.name = ''
  recordForm.type = ''
  recordForm.location = ''
  recordForm.description = ''
  formMessage.value = `Record added. Unique code: ${created.code}`
}
</script>
