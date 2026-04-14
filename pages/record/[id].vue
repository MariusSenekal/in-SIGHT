<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
          <v-btn variant="tonal" prepend-icon="mdi-arrow-left" class="mb-4" @click="goBack()">Back to Welcome Page</v-btn>

          <div v-if="record">
            <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ record.name }}</h1>
            <v-chip color="primary" variant="tonal" class="mb-2">{{ record.code }}</v-chip>
            <p><strong>Type:</strong> {{ record.type }}</p>
            <p><strong>Location:</strong> {{ record.location }}</p>
            <p class="text-medium-emphasis mt-2">{{ record.description }}</p>

            <v-card variant="outlined" rounded="lg" class="mt-4 pa-4 text-center">
              <h3 class="text-h6 mb-1">Scan QR Code</h3>
              <p class="text-medium-emphasis mb-4">Scan this QR code to view record details on any device.</p>
              <div class="d-flex justify-center mb-3">
                <QrcodeVue
                  :value="qrCodeUrl"
                  :size="280"
                  level="H"
                  render-as="svg"
                />
              </div>
              <v-btn color="primary" prepend-icon="mdi-printer" @click="printQR">Print QR Code</v-btn>
            </v-card>
          </div>

          <v-alert v-else type="error" variant="tonal" border="start">
            Record not found. The requested record could not be located.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const route = useRoute()
const { initAuth } = useAuth()
const { goBack } = useAppNavigation()
const { getRecordById } = useRecords()

const recordId = parseInt(route.params.id as string)
const record = getRecordById(recordId)

onMounted(() => {
  initAuth()
})

// Generate URL for QR code that points to the scan page
const qrCodeUrl = computed(() => {
  if (!record) {
    return '/scan'
  }

  if (import.meta.client) {
    return `${window.location.origin}/scan/${record.code}`
  }
  return `/scan/${record.code}`
})

const printQR = () => {
  window.print()
}

</script>
