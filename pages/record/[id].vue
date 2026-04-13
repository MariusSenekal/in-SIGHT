<template>
  <div class="container">
    <div class="detail-container">
      <button
        v-if="isAdmin"
        type="button"
        class="back-button"
        @click="goBackToAdmin"
      >
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Back to Admin Area
      </button>
      <NuxtLink v-else to="/records" class="back-button">← Back to Records</NuxtLink>

      <div v-if="record">
        <h1>{{ record.name }}</h1>
        <p><strong>Record Code:</strong> {{ record.code }}</p>
        <p><strong>Type:</strong> {{ record.type }}</p>
        <p><strong>Location:</strong> {{ record.location }}</p>
        <p style="margin-top: 20px;">{{ record.description }}</p>

        <div class="qr-section">
          <h3>📱 Scan QR Code</h3>
          <p style="margin-bottom: 20px; color: #666;">
            Scan this QR code to view record details on any device
          </p>
          <div class="qr-code-wrapper">
            <QrcodeVue
              :value="qrCodeUrl"
              :size="300"
              level="H"
              render-as="svg"
            />
          </div>
          <br />
          <button @click="printQR" class="print-button">🖨️ Print QR Code</button>
        </div>
      </div>

      <div v-else>
        <h1>Record Not Found</h1>
        <p>The requested record could not be found.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const { isAdmin, initAuth } = useAuth()
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

const goBackToAdmin = () => {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }

  navigateTo('/dashboard')
}
</script>
