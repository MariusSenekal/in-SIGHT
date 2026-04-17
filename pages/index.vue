<template>
  <v-container class="py-6" fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card v-if="!currentUser" rounded="xl" elevation="8" class="pa-4 pa-md-8">
          <div class="d-flex flex-column align-center text-center mb-4">
            <img :src="logoUrl" alt="in-SIGHT logo" class="heading-search-icon" />
            <p class="text-medium-emphasis mt-2">Welcome back! Sign in to continue.</p>
          </div>

          <v-form v-if="mode === 'login'" @submit.prevent="submitLogin">
            <v-row dense>
              <v-col cols="12">
                <v-text-field v-model="loginForm.username" label="Username" prepend-inner-icon="mdi-account" variant="outlined" required />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="loginForm.password"
                  :type="showLoginPassword ? 'text' : 'password'"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showLoginPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  variant="outlined"
                  required
                  @click:append-inner="showLoginPassword = !showLoginPassword"
                />
              </v-col>
              <v-col cols="12">
                <v-btn block color="primary" size="large" prepend-icon="mdi-login" type="submit">Login</v-btn>
              </v-col>
            </v-row>
          </v-form>

          <v-form v-else @submit.prevent="submitSignup">
            <v-row dense>
              <v-col cols="12">
                <v-text-field v-model="signupForm.name" label="Full Name" prepend-inner-icon="mdi-badge-account" variant="outlined" required />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="signupForm.username" label="Username" prepend-inner-icon="mdi-account-plus" variant="outlined" required />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="signupForm.password"
                  :type="showSignupPassword ? 'text' : 'password'"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showSignupPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  variant="outlined"
                  required
                  @click:append-inner="showSignupPassword = !showSignupPassword"
                />
              </v-col>
              <v-col cols="12">
                <v-btn block color="primary" size="large" prepend-icon="mdi-account-plus" type="submit">Create Account</v-btn>
              </v-col>
            </v-row>
          </v-form>

          <div class="d-flex flex-column align-center mt-4">
            <p class="text-medium-emphasis mb-2">Switch form</p>
            <v-btn-toggle v-model="mode" mandatory color="primary">
              <v-btn value="login" prepend-icon="mdi-login">Login</v-btn>
              <v-btn value="signup" prepend-icon="mdi-account-plus">Sign Up</v-btn>
            </v-btn-toggle>
          </div>

          <v-alert v-if="formMessage" type="info" variant="tonal" border="start" class="mt-4">{{ formMessage }}</v-alert>
          <v-alert type="info" variant="tonal" border="start" class="mt-3">Admin demo login: admin / admin123</v-alert>
        </v-card>

        <v-card v-else rounded="xl" elevation="8" class="pa-4 pa-md-6">
          <div class="d-flex justify-center mb-4">
            <img :src="logoUrl" alt="in-SIGHT logo" class="heading-search-icon" />
          </div>

          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <h1 class="text-h4 text-md-h3 font-weight-bold">Welcome back {{ currentUser.name }}</h1>
              <p class="text-medium-emphasis">Choose what you want to do next.</p>
            </div>
            <div class="d-flex ga-2">
              <v-btn icon="mdi-account-circle" variant="tonal" @click="showProfileModal = true" />
              <v-btn color="error" variant="tonal" prepend-icon="mdi-logout" @click="logout">Log Out</v-btn>
            </div>
          </div>

          <div class="d-flex flex-column align-center ga-3">
            <v-card rounded="lg" variant="tonal" class="w-100" max-width="560" @click="goToScan">
              <v-card-title class="d-flex align-center ga-2 justify-center"><v-icon icon="mdi-qrcode-scan" />Scan QR Code</v-card-title>
              <v-card-text class="text-medium-emphasis text-center">Open camera scanning immediately.</v-card-text>
            </v-card>

            <v-card rounded="lg" variant="tonal" class="w-100" max-width="560" @click="goToUpload">
              <v-card-title class="d-flex align-center ga-2 justify-center"><v-icon icon="mdi-camera" />Upload Photo</v-card-title>
              <v-card-text class="text-medium-emphasis text-center">Upload cleaning evidence and media.</v-card-text>
            </v-card>

            <v-card v-if="isAdmin" rounded="lg" variant="tonal" class="w-100" max-width="560" @click="goToDashboard">
              <v-card-title class="d-flex align-center ga-2 justify-center"><v-icon icon="mdi-view-dashboard" />Dashboards and Management</v-card-title>
              <v-card-text class="text-medium-emphasis text-center">Admin tools, records, and reporting.</v-card-text>
            </v-card>

            <v-card rounded="lg" variant="tonal" class="w-100" max-width="560" @click="showMaintenanceDialog = true">
              <v-card-title class="d-flex align-center ga-2 justify-center"><v-icon icon="mdi-wrench-outline" />Request Maintenance</v-card-title>
              <v-card-text class="text-medium-emphasis text-center">Report a maintenance issue or cleaning request.</v-card-text>
            </v-card>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showMaintenanceDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon icon="mdi-wrench-outline" />
          Request Maintenance
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="maintenanceForm.targetType"
            :items="[{ title: 'Site / Room', value: 'site-room' }, { title: 'QR Code / Record', value: 'qr' }]"
            item-title="title"
            item-value="value"
            label="Target Type"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-autocomplete
            v-if="maintenanceForm.targetType === 'qr'"
            v-model="maintenanceForm.recordCode"
            :items="allRecordSelectItems"
            item-title="label"
            item-value="value"
            label="Select Record / QR Code"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field
            v-else
            v-model="maintenanceForm.siteRoom"
            label="Site / Room"
            prepend-inner-icon="mdi-map-marker-outline"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-textarea
            v-model="maintenanceForm.message"
            label="Describe the issue"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            rows="3"
          />
          <v-alert v-if="maintenanceFeedback" type="success" variant="tonal" density="compact" class="mt-2">{{ maintenanceFeedback }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showMaintenanceDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-send" @click="submitMaintenanceRequest">Submit Request</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showProfileModal" max-width="460">
      <v-card rounded="lg">
        <v-card-title>My Profile</v-card-title>
        <v-card-text>
          <p><strong>Name:</strong> {{ currentUser?.profile?.displayName || currentUser?.name }}</p>
          <p><strong>Username:</strong> {{ currentUser?.username }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showProfileModal = false">Close</v-btn>
          <v-btn color="primary" @click="goToProfilePage">Open Profile Page</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
type AuthMode = 'login' | 'signup'

const logoUrl = `${useRuntimeConfig().app.baseURL}branding/login-logo-slide1-trimmed.png`
const { currentUser, isAdmin, initAuth, login, signup, logout } = useAuth()
const { addRequest } = useServiceRequests()
const { getRecords } = useRecords()

const mode = ref<AuthMode>('login')
const formMessage = ref('')
const showLoginPassword = ref(false)
const showSignupPassword = ref(false)
const showProfileModal = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const signupForm = reactive({
  name: '',
  username: '',
  password: ''
})

// ── Maintenance Request ───────────────────────────────────────────────────────
const showMaintenanceDialog = ref(false)
const maintenanceFeedback = ref('')
const maintenanceForm = reactive({
  targetType: 'site-room' as 'qr' | 'site-room',
  recordCode: '',
  siteRoom: '',
  message: ''
})

const allRecordSelectItems = computed(() =>
  getRecords().map((r: { code: string; name: string }) => ({ label: `${r.code} - ${r.name}`, value: r.code }))
)

const submitMaintenanceRequest = () => {
  if (!maintenanceForm.message.trim()) {
    return
  }

  addRequest({
    requestType: 'maintenance',
    targetType: maintenanceForm.targetType,
    recordCode: maintenanceForm.targetType === 'qr' ? maintenanceForm.recordCode : null,
    siteRoom: maintenanceForm.targetType === 'site-room' ? maintenanceForm.siteRoom.trim() || null : null,
    message: maintenanceForm.message.trim(),
    requestedBy: currentUser.value?.profile?.displayName || currentUser.value?.name || 'Unknown',
    requestedByUserId: currentUser.value?.id ?? null
  })

  maintenanceFeedback.value = 'Maintenance request submitted successfully!'
  setTimeout(() => {
    showMaintenanceDialog.value = false
    maintenanceFeedback.value = ''
    maintenanceForm.message = ''
    maintenanceForm.siteRoom = ''
    maintenanceForm.recordCode = ''
  }, 1500)
}


onMounted(() => {
  initAuth()
})

const submitLogin = () => {
  const result = login(loginForm.username, loginForm.password)
  if (!result.ok) {
    formMessage.value = result.message
    return
  }

  formMessage.value = ''
  loginForm.username = ''
  loginForm.password = ''
}

const submitSignup = () => {
  const result = signup(signupForm.name, signupForm.username, signupForm.password)
  formMessage.value = result.message

  if (!result.ok) {
    return
  }

  signupForm.name = ''
  signupForm.username = ''
  signupForm.password = ''
  mode.value = 'login'
}

const goToScan = () => navigateTo('/scan')
const goToUpload = () => navigateTo('/upload')
const goToDashboard = () => navigateTo('/dashboard')
const goToProfilePage = () => {
  showProfileModal.value = false
  navigateTo('/profile')
}
</script>
