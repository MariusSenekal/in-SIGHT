<template>
  <v-container class="py-6">
    <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">Service Requests</h1>
          <p class="text-medium-emphasis">Review maintenance and cleaning requests from users.</p>
        </div>
        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack({ adminFallback: '/' })">Back</v-btn>
          <v-btn color="error" variant="tonal" prepend-icon="mdi-logout" @click="handleLogout">Log Out</v-btn>
        </div>
      </div>

      <v-alert v-if="requests.length === 0" type="info" variant="tonal" border="start">
        No requests have been submitted yet.
      </v-alert>

      <v-row v-else dense>
        <v-col cols="12" md="6" v-for="request in requests" :key="request.id">
          <v-card rounded="lg" variant="outlined" class="h-100">
            <v-card-title class="d-flex align-center justify-space-between ga-2">
              <span>{{ request.requestType === 'maintenance' ? 'Maintenance Request' : 'Cleaning Request' }}</span>
              <v-chip size="small" :color="request.status === 'open' ? 'warning' : 'success'" variant="tonal">{{ request.status }}</v-chip>
            </v-card-title>
            <v-card-text>
              <p><strong>Requested By:</strong> {{ request.requestedBy }}</p>
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
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
const { currentUser, isAdmin, initAuth, logout } = useAuth()
const { goBack } = useAppNavigation()
const { getRequests, setRequestStatus } = useServiceRequests()

const requests = computed(() => getRequests())

onMounted(() => {
  initAuth()

  if (!currentUser.value || !isAdmin.value) {
    navigateTo('/')
  }
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
  return new Date(iso).toLocaleString()
}
</script>

