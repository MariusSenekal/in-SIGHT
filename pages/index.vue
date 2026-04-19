<template>
  <!-- ══ NOT LOGGED IN — Auth page ═══════════════════════════════════════════ -->
  <div v-if="!currentUser" class="auth-page-wrap">
    <!-- Mobile: stacked card layout -->
    <div class="auth-mobile-wrap">
      <v-container class="py-6">
        <v-row justify="center">
          <v-col cols="12" sm="9">
            <div class="d-flex flex-column align-center mb-5">
              <img :src="logoUrl" alt="in-SIGHT logo" class="heading-search-icon" />
              <p class="text-medium-emphasis text-center mt-2 text-body-2">
                Professional cleaning management platform
              </p>
            </div>
            <v-card rounded="xl" elevation="4" class="pa-5">
              <h3 class="text-h6 font-weight-bold mb-4">
                {{ mode === 'login' ? 'Sign in to your account' : 'Create an account' }}
              </h3>

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
                    <v-btn block color="primary" size="large" prepend-icon="mdi-login" type="submit" class="btn-gradient">Sign In</v-btn>
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
                    <v-btn block color="primary" size="large" prepend-icon="mdi-account-plus" type="submit" class="btn-gradient">Create Account</v-btn>
                  </v-col>
                </v-row>
              </v-form>

              <div class="d-flex align-center justify-center ga-2 mt-4">
                <span class="text-body-2 text-medium-emphasis">
                  {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
                </span>
                <v-btn variant="text" color="primary" size="small" @click="mode = mode === 'login' ? 'signup' : 'login'">
                  {{ mode === 'login' ? 'Sign Up' : 'Sign In' }}
                </v-btn>
              </div>

              <v-alert v-if="formMessage" type="error" variant="tonal" border="start" density="compact" class="mt-3">{{ formMessage }}</v-alert>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Desktop: split layout -->
    <div class="auth-split">
      <!-- Hero panel -->
      <div class="auth-split__hero">
        <img :src="logoUrl" alt="in-SIGHT logo" class="auth-hero-logo" />
        <h2>Clean Operations.<br />Smart Records.</h2>
        <p>
          in-SIGHT keeps your team's cleaning schedules, photo evidence
          and QR check-ins in one place — accessible from any device.
        </p>
        <div class="auth-hero-features">
          <div v-for="f in heroFeatures" :key="f.icon" class="auth-hero-feature">
            <v-icon :icon="f.icon" size="18" class="mr-2" />
            <span>{{ f.label }}</span>
          </div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="auth-split__form">
        <div class="auth-split__form-inner">
          <h3 class="text-h5 font-weight-bold mb-1">
            {{ mode === 'login' ? 'Sign in to your account' : 'Create an account' }}
          </h3>
          <p class="text-medium-emphasis text-body-2 mb-5">
            {{ mode === 'login' ? 'Welcome back — enter your details below.' : 'Get started with in-SIGHT today.' }}
          </p>

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
                <v-btn block color="primary" size="large" prepend-icon="mdi-login" type="submit" class="btn-gradient">Sign In</v-btn>
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
                <v-btn block color="primary" size="large" prepend-icon="mdi-account-plus" type="submit" class="btn-gradient">Create Account</v-btn>
              </v-col>
            </v-row>
          </v-form>

          <div class="d-flex align-center justify-center ga-2 mt-4">
            <span class="text-body-2 text-medium-emphasis">
              {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
            </span>
            <v-btn variant="text" color="primary" size="small" @click="mode = mode === 'login' ? 'signup' : 'login'">
              {{ mode === 'login' ? 'Sign Up' : 'Sign In' }}
            </v-btn>
          </div>

          <v-alert v-if="formMessage" type="error" variant="tonal" border="start" density="compact" class="mt-3">{{ formMessage }}</v-alert>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ LOGGED IN — Home dashboard ══════════════════════════════════════════ -->
  <v-container v-else class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="9" xl="8">

        <!-- Welcome header card -->
        <v-card rounded="xl" elevation="3" class="mb-5 overflow-hidden">
          <div class="welcome-hero">
            <div class="welcome-hero__content">
              <div class="welcome-hero__avatar">
                <v-icon icon="mdi-account" size="28" color="white" />
              </div>
              <div>
                <h1 class="text-h5 text-sm-h4 font-weight-bold text-white">
                  Welcome back, {{ currentUser.profile?.displayName || currentUser.name }}
                </h1>
              </div>
            </div>
            <div class="welcome-hero__actions">
              <v-btn
                icon="mdi-account-circle-outline"
                variant="tonal"
                color="white"
                size="small"
                class="mr-1"
                @click="showProfileModal = true"
              />
              <v-btn
                color="white"
                variant="outlined"
                prepend-icon="mdi-logout"
                size="small"
                @click="logout"
              >Log Out</v-btn>
            </div>
          </div>
        </v-card>

        <!-- Action cards grid -->
        <v-row dense>
          <v-col cols="12" sm="6" v-for="action in visibleActions" :key="action.key">
            <v-card
              rounded="xl"
              elevation="2"
              class="action-home-card cursor-pointer"
              @click="action.action()"
            >
              <div class="action-home-card__strip" :style="`background: linear-gradient(90deg, ${action.color1} 0%, ${action.color2} 100%)`" />
              <v-card-text class="pa-5">
                <div class="d-flex align-center ga-3 mb-2">
                  <div class="action-home-card__icon" :style="`background: linear-gradient(135deg, ${action.color1} 0%, ${action.color2} 100%)`">
                    <v-icon :icon="action.icon" color="white" size="22" />
                  </div>
                  <h3 class="text-subtitle-1 font-weight-bold">{{ action.title }}</h3>
                </div>
                <p class="text-body-2 text-medium-emphasis">{{ action.description }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-col>
    </v-row>

    <!-- Maintenance dialog -->
    <v-dialog v-model="showMaintenanceDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2 pa-5 pb-3">
          <v-icon icon="mdi-wrench-outline" color="primary" />
          Request Maintenance
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <v-select
            v-model="maintenanceForm.targetType"
            :items="[{ title: 'Site / Room', value: 'site-room' }, { title: 'QR Code / Record', value: 'qr' }]"
            item-title="title"
            item-value="value"
            label="Target Type"
            variant="outlined"
            density="comfortable"
            class="mb-3"
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
            class="mb-3"
          />
          <v-text-field
            v-else
            v-model="maintenanceForm.siteRoom"
            label="Site / Room"
            prepend-inner-icon="mdi-map-marker-outline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-textarea
            v-model="maintenanceForm.message"
            label="Describe the issue"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            rows="3"
          />
          <v-alert v-if="maintenanceFeedback" type="success" variant="tonal" density="compact" class="mt-2">
            {{ maintenanceFeedback }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showMaintenanceDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-send" @click="submitMaintenanceRequest">
            Submit Request
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Profile quick-view dialog -->
    <v-dialog v-model="showProfileModal" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">My Profile</v-card-title>
        <v-card-text class="pa-5 pt-1">
          <p class="mb-1"><strong>Name:</strong> {{ currentUser?.profile?.displayName || currentUser?.name }}</p>
          <p><strong>Username:</strong> {{ currentUser?.username }}</p>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showProfileModal = false">Close</v-btn>
          <v-btn color="primary" variant="flat" @click="goToProfilePage">Open Profile Page</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup lang="ts">
definePageMeta({ ssr: false })

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

const loginForm = reactive({ username: '', password: '' })
const signupForm = reactive({ name: '', username: '', password: '' })

const heroFeatures = [
  { icon: 'mdi-qrcode-scan',    label: 'Instant QR code check-ins' },
  { icon: 'mdi-camera',         label: 'Photo evidence uploads' },
  { icon: 'mdi-check-all',      label: 'Checklist management' },
  { icon: 'mdi-chart-bar',      label: 'Reporting & history' },
]

// ── Maintenance ───────────────────────────────────────────────────────────────
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
  if (!maintenanceForm.message.trim()) return

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

// ── Action cards (shown to logged-in user) ────────────────────────────────────
const allActions = computed(() => [
  {
    key: 'scan',
    title: 'Scan QR Code',
    description: 'Open camera and scan a QR code to log a service or check record details.',
    icon: 'mdi-qrcode-scan',
    color1: 'rgb(var(--v-theme-primary))',
    color2: 'rgb(var(--v-theme-secondary))',
    action: () => navigateTo('/scan'),
    adminOnly: false
  },
  {
    key: 'upload',
    title: 'Upload Photo',
    description: 'Attach photographic cleaning evidence directly to existing records.',
    icon: 'mdi-camera-plus-outline',
    color1: '#06b6d4',
    color2: '#0891b2',
    action: () => navigateTo('/upload'),
    adminOnly: false
  },
  {
    key: 'dashboard',
    title: 'Dashboards & Management',
    description: 'Access admin tools, manage records, run checklists and view reports.',
    icon: 'mdi-view-dashboard-outline',
    color1: '#7c3aed',
    color2: '#6d28d9',
    action: () => navigateTo('/dashboard'),
    adminOnly: true
  },
  {
    key: 'maintenance',
    title: 'Request Maintenance',
    description: 'Report a maintenance issue or cleaning request to your admin team.',
    icon: 'mdi-wrench-clock-outline',
    color1: '#ea580c',
    color2: '#c2410c',
    action: () => { showMaintenanceDialog.value = true },
    adminOnly: false
  },
])

const visibleActions = computed(() =>
  allActions.value.filter(a => !a.adminOnly || isAdmin.value)
)

onMounted(() => { initAuth() })

const submitLogin = () => {
  const result = login(loginForm.username, loginForm.password)
  if (!result.ok) { formMessage.value = result.message; return }
  formMessage.value = ''
  loginForm.username = ''
  loginForm.password = ''
}

const submitSignup = () => {
  const result = signup(signupForm.name, signupForm.username, signupForm.password)
  formMessage.value = result.message
  if (!result.ok) return
  signupForm.name = ''
  signupForm.username = ''
  signupForm.password = ''
  mode.value = 'login'
}

const goToProfilePage = () => {
  showProfileModal.value = false
  navigateTo('/profile')
}
</script>

<style scoped>
/* Auth page wrapper */
.auth-page-wrap { min-height: 100vh; }

/* Mobile card: hidden on md+ */
.auth-mobile-wrap { display: block; }
@media (min-width: 960px) { .auth-mobile-wrap { display: none; } }

/* Desktop split: hidden on mobile, shown as grid on md+ */
.auth-split {
  display: none;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}
@media (min-width: 960px) { .auth-split { display: grid; } }

.auth-split__form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: rgb(var(--v-theme-surface));
}

.auth-split__form-inner { width: 100%; max-width: 400px; }

.auth-hero-logo {
  height: clamp(70px, 9vw, 120px);
  width: auto;
  max-width: 280px;
  display: block;
  object-fit: contain;
  mix-blend-mode: multiply;
  opacity: 0.92;
}

.auth-hero-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.auth-hero-feature {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
}

/* Welcome hero */
.welcome-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  min-height: 100px;
}

.welcome-hero__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-hero__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

.welcome-hero__sub {
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
  margin-top: 2px;
}

.welcome-hero__actions { display: flex; align-items: center; gap: 8px; }

/* Action cards */
.action-home-card {
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1) !important;
  overflow: hidden;
}

.action-home-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
}

.action-home-card__strip { height: 4px; }

.action-home-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 599px) {
  .welcome-hero { padding: 18px 16px; }
  .welcome-hero__avatar { width: 42px; height: 42px; }
}
</style>
