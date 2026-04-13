<template>
  <div class="container">
    <div class="scan-result">
      <h1>✅ QR Code Scanned</h1>

      <div v-if="record">
        <div class="record-card captured-record-card">
          <h2>{{ record.name }}</h2>
          <p><strong>Code:</strong> {{ record.code }}</p>
          <p><strong>Type:</strong> {{ record.type }}</p>
          <p><strong>Location:</strong> {{ record.location }}</p>
          <p>{{ record.description }}</p>
        </div>

        <NuxtLink to="/records" class="back-button" style="margin-top: 40px;">
          View All Records
        </NuxtLink>
      </div>

      <div v-else>
        <p class="record-name">Record Not Found</p>
        <p>This QR code does not match any existing record.</p>
        
        <NuxtLink to="/" class="back-button" style="margin-top: 40px;">
          Go to Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getRecordByCode, getRecordById } = useRecords()

const recordParam = String(route.params.id || '').trim()
const numericId = Number.parseInt(recordParam, 10)

const record = computed(() => {
  const byCode = getRecordByCode(recordParam)

  if (byCode) {
    return byCode
  }

  if (!Number.isNaN(numericId)) {
    return getRecordById(numericId)
  }

  return undefined
})
</script>
