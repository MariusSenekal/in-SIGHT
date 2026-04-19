<template>
  <v-container class="py-6">
    <!-- Live new-request snackbar -->
    <v-snackbar
      v-model="newRequestSnack"
      location="top right"
      color="primary"
      timeout="6000"
      multi-line
    >
      <v-icon icon="mdi-bell-ring" class="mr-2" />
      {{ newRequestLabel }}
      <template #actions>
        <v-btn variant="text" @click="newRequestSnack = false">Dismiss</v-btn>
      </template>
    </v-snackbar>

    <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">Service Requests</h1>
          <p class="text-medium-emphasis">Review maintenance, cleaning and satisfaction feedback from users.</p>
        </div>
        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack({ adminFallback: '/' })">Back</v-btn>
          <v-btn color="error" variant="tonal" prepend-icon="mdi-logout" @click="handleLogout">Log Out</v-btn>
        </div>
      </div>

      <!-- Stats summary -->
      <v-row dense class="mb-4">
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="success" variant="tonal" class="pa-3 text-center">
            <div class="text-h4 font-weight-bold">{{ happyCount }}</div>
            <div class="text-body-2 mt-1">😊 Happy</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="error" variant="tonal" class="pa-3 text-center">
            <div class="text-h4 font-weight-bold">{{ sadCount }}</div>
            <div class="text-body-2 mt-1">😞 Sad</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="primary" variant="tonal" class="pa-3 text-center">
            <div class="text-h4 font-weight-bold">{{ cleaningCount }}</div>
            <div class="text-body-2 mt-1">🧹 Cleaning</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="warning" variant="tonal" class="pa-3 text-center">
            <div class="text-h4 font-weight-bold">{{ maintenanceCount }}</div>
            <div class="text-body-2 mt-1">🔧 Maintenance</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filter tabs -->
      <v-tabs v-model="filterTab" color="primary" class="mb-4">
        <v-tab value="all">All</v-tab>
        <v-tab value="maintenance">Maintenance</v-tab>
        <v-tab value="cleaning">Cleaning</v-tab>
        <v-tab value="satisfaction">Satisfaction</v-tab>
        <v-tab value="open">Open</v-tab>
      </v-tabs>

      <v-alert v-if="filteredRequests.length === 0" type="info" variant="tonal" border="start">
        No requests match the current filter.
      </v-alert>

      <v-row v-else dense>
        <v-col cols="12" md="6" v-for="request in filteredRequests" :key="request.id">
          <v-card
            rounded="lg"
            variant="outlined"
            class="h-100"
            :class="{ 'request-card--new': highlightedId === request.id }"
          >
            <v-card-title class="d-flex align-center justify-space-between ga-2 flex-wrap">
              <div class="d-flex align-center ga-2">
                <span v-if="request.requestType === 'satisfaction'" class="text-h6">
                  {{ request.satisfactionEmoji === 'happy' ? '😊' : '😞' }}
                </span>
                <v-icon v-else-if="request.requestType === 'maintenance'" icon="mdi-wrench" color="error" size="20" />
                <v-icon v-else icon="mdi-broom" color="success" size="20" />
                <span>{{ requestTypeLabel(request.requestType) }}</span>
              </div>
              <v-chip size="small" :color="request.status === 'open' ? 'warning' : 'success'" variant="tonal">{{ request.status }}</v-chip>
            </v-card-title>

            <v-card-text>
              <!-- Satisfaction highlight -->
              <v-alert
                v-if="request.requestType === 'satisfaction'"
                :type="request.satisfactionEmoji === 'happy' ? 'success' : 'error'"
                variant="tonal"
                density="compact"
                rounded="lg"
                class="mb-2"
              >
                <strong>{{ request.satisfactionEmoji === 'happy' ? '😊 Happy' : '😞 Sad' }}</strong> — {{ request.requestedBy }} rated their latest service.
              </v-alert>

              <p><strong>From:</strong> {{ request.requestedBy }}</p>
              <p><strong>Target:</strong> {{ targetLabel(request) }}</p>
              <p><strong>Message:</strong> {{ request.message }}</p>
              <p class="text-medium-emphasis"><strong>Time:</strong> {{ formatDate(request.createdAt) }}</p>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="request.status === 'open'"
                color="success"
                prepend-icon="mdi-check"
                @click="markResolved(request.id)"
              >
                Mark Resolved
              </v-btn>
              <v-btn
                v-else
                color="warning"
                variant="tonal"
                prepend-icon="mdi-restore"
                @click="markOpen(request.id)"
              >
                Reopen
              </v-btn>
              <v-spacer />
              <v-btn
                color="error"
                variant="text"
                icon="mdi-delete-outline"
                size="small"
                @click="confirmDelete(request)"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-container>

  <!-- ── Delete Request Confirm Dialog ──────────────────────────────────── -->
  <v-dialog v-model="showDeleteDialog" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2 text-error">
        <v-icon icon="mdi-delete-outline" />
        Delete Request
      </v-card-title>
      <v-card-text>
        <p>Delete this <strong>{{ deleteTarget ? requestTypeLabel(deleteTarget.requestType) : '' }}</strong> from <strong>{{ deleteTarget?.requestedBy }}</strong>?</p>
        <p class="text-medium-emphasis text-caption mt-2">This cannot be undone.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" prepend-icon="mdi-delete" @click="doDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { ServiceRequest } from '~/composables/useServiceRequests'

const { currentUser, isAdmin, initAuth, logout } = useAuth()
const { goBack } = useAppNavigation()
const { getRequests, loadRequests, setRequestStatus, requests, deleteRequest } = useServiceRequests()
const { connect, disconnect } = useSocket()

const filterTab = ref('all')
const newRequestSnack = ref(false)
const latestNewRequest = ref<ServiceRequest | null>(null)
const highlightedId = ref<number | null>(null)

const allRequests = computed(() => getRequests())

const happyCount = computed(() => allRequests.value.filter(r => r.requestType === 'satisfaction' && r.satisfactionEmoji === 'happy').length)
const sadCount = computed(() => allRequests.value.filter(r => r.requestType === 'satisfaction' && r.satisfactionEmoji === 'sad').length)
const cleaningCount = computed(() => allRequests.value.filter(r => r.requestType === 'cleaning').length)
const maintenanceCount = computed(() => allRequests.value.filter(r => r.requestType === 'maintenance').length)

const filteredRequests = computed(() => {
  if (filterTab.value === 'all') { return allRequests.value }
  if (filterTab.value === 'open') { return allRequests.value.filter(r => r.status === 'open') }
  return allRequests.value.filter(r => r.requestType === filterTab.value)
})

onMounted(async () => {
  initAuth()

  if (!currentUser.value || !isAdmin.value) {
    navigateTo('/')
    return
  }

  // Always fetch fresh data when visiting this page.
  await loadRequests()

  // Connect to Socket.io and listen for new service requests in real-time.
  const socket = connect()

  socket.on('new-service-request', (req: ServiceRequest) => {
    // Prepend to shared state so it appears immediately at the top.
    requests.value = [req, ...requests.value]

    // Flash the card briefly.
    highlightedId.value = req.id
    setTimeout(() => { highlightedId.value = null }, 2500)

    // Show a snackbar notification.
    latestNewRequest.value = req
    newRequestSnack.value = true
  })
})

onUnmounted(() => {
  disconnect()
})

const handleLogout = () => {
  logout()
  navigateTo('/')
}

const markResolved = (id: number) => {
  setRequestStatus(id, 'resolved')
}

const markOpen = (id: number) => {
  setRequestStatus(id, 'open')
}

const showDeleteDialog = ref(false)
const deleteTarget = ref<ServiceRequest | null>(null)

const confirmDelete = (req: ServiceRequest) => {
  deleteTarget.value = req
  showDeleteDialog.value = true
}

const doDelete = async () => {
  if (!deleteTarget.value) return
  await deleteRequest(deleteTarget.value.id)
  showDeleteDialog.value = false
  deleteTarget.value = null
}

const requestTypeLabel = (type: ServiceRequest['requestType']) => {
  if (type === 'maintenance') { return 'Maintenance Request' }
  if (type === 'satisfaction') { return 'Satisfaction Feedback' }
  return 'Cleaning Request'
}

const targetLabel = (request: { targetType: string; recordCode: string | null; siteRoom: string | null }) => {
  if (request.targetType === 'qr' && request.recordCode) {
    return `QR: ${request.recordCode}`
  }

  if (request.siteRoom) {
    return `Site/Room: ${request.siteRoom}`
  }

  return 'Unknown target'
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })
}

const newRequestLabel = computed(() => {
  if (!latestNewRequest.value) return ''
  const r = latestNewRequest.value
  const icon = r.requestType === 'maintenance' ? '🔧' : r.requestType === 'satisfaction' ? (r.satisfactionEmoji === 'happy' ? '😊' : '😞') : '🧹'
  return `${icon} New ${requestTypeLabel(r.requestType)} from ${r.requestedBy}`
})
</script>

<style scoped>
@keyframes highlightPulse {
  0%   { box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.5); background-color: rgba(var(--v-theme-primary), 0.08); }
  70%  { box-shadow: 0 0 0 8px rgba(var(--v-theme-primary), 0); background-color: transparent; }
  100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0); background-color: transparent; }
}
.request-card--new {
  animation: highlightPulse 2.5s ease-out forwards;
}
</style>

