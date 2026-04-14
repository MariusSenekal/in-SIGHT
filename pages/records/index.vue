<template>
  <v-container class="py-6">
    <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">in-SIGHT Records</h1>
          <p class="text-medium-emphasis">View and manage your cleaning records.</p>
        </div>
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack()">Back to Welcome Page</v-btn>
      </div>

      <v-card v-if="isAdmin" variant="outlined" rounded="lg" class="mb-4">
        <v-card-title>Add Record</v-card-title>
        <v-card-subtitle>Create a new record with its own unique QR code identifier.</v-card-subtitle>
        <v-card-text>
          <v-form @submit.prevent="submitRecord">
            <v-row dense>
              <v-col cols="12" md="6"><v-text-field v-model="recordForm.name" label="Record Name" variant="outlined" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="recordForm.type" label="Type" variant="outlined" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="recordForm.location" label="Location" variant="outlined" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="recordForm.description" label="Description" variant="outlined" required /></v-col>
              <v-col cols="12"><v-btn type="submit" color="primary" prepend-icon="mdi-plus">Add Record</v-btn></v-col>
            </v-row>
          </v-form>
          <v-alert v-if="formMessage" type="success" variant="tonal" density="compact" class="mt-3">{{ formMessage }}</v-alert>
        </v-card-text>
      </v-card>

      <v-row dense>
        <v-col cols="12" md="6" lg="4" v-for="record in records" :key="record.id">
          <v-card :to="`/record/${record.id}`" rounded="lg" variant="tonal" class="h-100">
            <v-card-title>{{ record.name }}</v-card-title>
            <v-card-text>
              <p><strong>Code:</strong> {{ record.code }}</p>
              <p class="text-medium-emphasis mb-2">{{ record.description }}</p>
              <p><strong>Location:</strong> {{ record.location }}</p>
              <v-chip size="small" color="info" variant="tonal" class="mt-2">{{ record.type }}</v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
const { isAdmin, initAuth } = useAuth()
const { goBack } = useAppNavigation()
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
