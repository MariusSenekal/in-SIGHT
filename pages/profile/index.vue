<template>
  <v-container class="py-6">
    <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6 mb-4">
      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-3">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">My Profile</h1>
          <p class="text-medium-emphasis">Manage account details, personal records, and service history.</p>
        </div>
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack()">Back to Welcome Page</v-btn>
      </div>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-card variant="outlined" rounded="lg">
            <v-card-title>Profile Details</v-card-title>
            <v-card-text>
              <v-form @submit.prevent="saveProfile">
                <v-text-field v-model="profileForm.displayName" label="Display Name" variant="outlined" maxlength="60" required />
                <v-text-field v-model="profileForm.phone" label="Phone" variant="outlined" maxlength="30" />
                <v-text-field v-model="profileForm.location" label="Site / Room" variant="outlined" maxlength="80" />
                <v-textarea v-model="profileForm.bio" label="Bio" variant="outlined" rows="3" maxlength="180" />
                <v-btn type="submit" color="primary" prepend-icon="mdi-content-save">Save Profile</v-btn>
              </v-form>
              <v-alert v-if="profileMessage" type="success" variant="tonal" density="compact" class="mt-3">{{ profileMessage }}</v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" rounded="lg">
            <v-card-title>Create My QR Record</v-card-title>
            <v-card-subtitle>Create a personal site/room/equipment record with a distinct QR code.</v-card-subtitle>
            <v-card-text>
              <v-form @submit.prevent="createMyRecord">
                <v-text-field v-model="recordForm.name" label="Name" variant="outlined" maxlength="80" required />
                <v-select v-model="recordForm.type" :items="recordTypeOptions" label="Category" variant="outlined" required />
                <v-text-field v-model="recordForm.location" label="Location / Reference" variant="outlined" maxlength="100" required />
                <v-textarea v-model="recordForm.description" label="Description" variant="outlined" rows="3" maxlength="200" required />
                <v-btn type="submit" color="primary" prepend-icon="mdi-plus">Create Record</v-btn>
              </v-form>
              <v-alert v-if="recordMessage" type="success" variant="tonal" density="compact" class="mt-3">{{ recordMessage }}</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-card rounded="xl" elevation="4" class="pa-4 pa-md-6 mb-4">
      <h2 class="text-h5 font-weight-bold mb-1">My QR Records</h2>
      <p class="text-medium-emphasis mb-3">Each record below has its own distinct QR code.</p>

      <v-alert v-if="myRecords.length === 0" type="info" variant="tonal" border="start">No personal records yet. Create your first record above.</v-alert>

      <v-row v-else dense>
        <v-col cols="12" sm="6" md="4" v-for="item in myRecords" :key="item.id">
          <v-card rounded="lg" variant="tonal" class="h-100">
            <v-card-title>{{ item.name }}</v-card-title>
            <v-card-text>
              <p><strong>Code:</strong> {{ item.code }}</p>
              <p><strong>Category:</strong> {{ item.type }}</p>
              <p><strong>Location:</strong> {{ item.location }}</p>
              <div class="d-flex justify-center mt-2">
                <QrcodeVue :value="toScanUrl(item.code)" :size="132" level="H" render-as="svg" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-card rounded="xl" elevation="4" class="pa-4 pa-md-6">
      <h2 class="text-h5 font-weight-bold mb-1">My QR Service History</h2>
      <p class="text-medium-emphasis mb-3">History from requests linked to your QR codes.</p>

      <v-alert v-if="serviceHistory.length === 0" type="info" variant="tonal" border="start">
        No service history yet for your QR records.
      </v-alert>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Date</th>
            <th>QR Code</th>
            <th>Type</th>
            <th>Status</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in serviceHistory" :key="entry.id">
            <td>{{ formatDate(entry.createdAt) }}</td>
            <td>{{ entry.recordCode || '-' }}</td>
            <td>{{ entry.requestType }}</td>
            <td>{{ entry.status }}</td>
            <td>{{ entry.message }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-card rounded="xl" elevation="4" class="pa-4 pa-md-6 mt-4">
      <h2 class="text-h5 font-weight-bold mb-1">Schedule Tracking Updates</h2>
      <p class="text-medium-emphasis mb-3">Messages from staff/admin for your QR records.</p>

      <v-alert v-if="scheduleUpdates.length === 0" type="info" variant="tonal" border="start">
        No schedule updates yet for your records.
      </v-alert>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Date</th>
            <th>QR Code</th>
            <th>From</th>
            <th>Role</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in scheduleUpdates" :key="`${item.entryId}-${item.messageId}`">
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>{{ item.recordCode }}</td>
            <td>{{ item.fromName }}</td>
            <td>{{ item.fromRole }}</td>
            <td>{{ item.text }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const { currentUser, initAuth, updateProfile } = useAuth()
const { goBack } = useAppNavigation()
const { getRecordsByOwner, addRecord } = useRecords()
const { getRequests } = useServiceRequests()
const { getAllEntries } = useScheduleTracking()

const profileMessage = ref('')
const recordMessage = ref('')

const profileForm = reactive({
  displayName: '',
  phone: '',
  location: '',
  bio: ''
})

const recordForm = reactive({
  name: '',
  type: '',
  location: '',
  description: ''
})

const recordTypeOptions = [
  'Site',
  'Room',
  'Equipment',
  'Maintenance Area',
  'Cleaning Area',
  'Office',
  'Bathroom',
  'Kitchen',
  'Storage',
  'Vehicle',
  'Outdoor Area',
  'Other'
]

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

const myRecords = computed(() => {
  if (!currentUser.value) {
    return []
  }

  return getRecordsByOwner(currentUser.value.id)
})

const serviceHistory = computed(() => {
  const codes = new Set(myRecords.value.map(record => record.code))
  return getRequests().filter(request => {
    return request.recordCode ? codes.has(request.recordCode) : false
  })
})

const scheduleUpdates = computed(() => {
  const codes = new Set(myRecords.value.map(record => record.code.toUpperCase()))

  return getAllEntries()
    .filter(entry => codes.has(entry.recordCode.toUpperCase()))
    .flatMap(entry => {
      return entry.messages.map(message => ({
        entryId: entry.id,
        messageId: message.id,
        recordCode: entry.recordCode,
        fromName: message.fromName,
        fromRole: message.fromRole,
        text: message.text,
        createdAt: message.createdAt
      }))
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const saveProfile = () => {
  const result = updateProfile({
    displayName: profileForm.displayName,
    phone: profileForm.phone,
    location: profileForm.location,
    bio: profileForm.bio
  })

  profileMessage.value = result.message
}

const createMyRecord = () => {
  if (!currentUser.value) {
    return
  }

  const created = addRecord({
    name: recordForm.name.trim(),
    type: recordForm.type,
    location: recordForm.location.trim(),
    description: recordForm.description.trim(),
    ownerUserId: currentUser.value.id
  })

  recordMessage.value = `Record created with QR code: ${created.code}`

  recordForm.name = ''
  recordForm.type = ''
  recordForm.location = ''
  recordForm.description = ''
}

const toScanUrl = (code: string) => {
  if (import.meta.client) {
    return `${window.location.origin}/scan/${code}`
  }

  return `/scan/${code}`
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString()
}
</script>
