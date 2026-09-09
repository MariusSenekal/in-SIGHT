<template>
  <!-- ══ NOT LOGGED IN — Auth page ═══════════════════════════════════════════ -->
  <div v-if="!currentUser" class="auth-page-wrap">
    <!-- Mobile: stacked card layout -->
    <div class="auth-mobile-wrap">
      <v-container class="py-8">
        <v-row justify="center">
          <v-col cols="12" sm="9" md="7">
            <div class="mobile-hero-banner">
              <img
                :src="loginHeroUrl"
                alt="in-SIGHT — organise, manage and control your info, all on one secure platform"
                class="login-hero-img login-hero-img--mobile"
              />
            </div>
            <v-card rounded="xl" elevation="8" class="pa-6 pa-sm-7 mobile-login-card">
              <div class="d-flex align-center ga-2 mb-5">
                <div class="mobile-form-icon">
                  <v-icon icon="mdi-login" size="24" />
                </div>
                <h3 class="text-h5 font-weight-bold mb-0">Sign in to your account</h3>
              </div>

              <v-form @submit.prevent="submitLogin">
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
                    <v-btn
                      block
                      color="primary"
                      size="large"
                      prepend-icon="mdi-login"
                      type="submit"
                      class="btn-gradient"
                      :loading="loginLoading"
                      :disabled="loginLoading"
                    >
                      {{ loginLoading ? 'Signing in...' : 'Sign In' }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>

              <v-alert v-if="formMessage" :type="formMessageType" variant="tonal" border="start" density="compact" class="mt-3">{{ formMessage }}</v-alert>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Desktop: split layout -->
    <div class="auth-split">
      <!-- Hero panel -->
      <div class="auth-split__hero auth-split__hero--image">
        <img
          :src="loginHeroUrl"
          alt="in-SIGHT — in-FORMATION visible, accessible and secure"
          class="login-hero-img"
        />
      </div>

      <!-- Form panel -->
      <div class="auth-split__form">
        <div class="auth-split__form-inner">
          <h3 class="text-h5 font-weight-bold mb-1">Sign in to your account</h3>
          <p class="text-medium-emphasis text-body-2 mb-5">Welcome back — enter your details below.</p>

          <v-form @submit.prevent="submitLogin">
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
                <v-btn
                  block
                  color="primary"
                  size="large"
                  prepend-icon="mdi-login"
                  type="submit"
                  class="btn-gradient"
                  :loading="loginLoading"
                  :disabled="loginLoading"
                >
                  {{ loginLoading ? 'Signing in...' : 'Sign In' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-form>

          <v-alert v-if="formMessage" :type="formMessageType" variant="tonal" border="start" density="compact" class="mt-3">{{ formMessage }}</v-alert>
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
            <div class="welcome-hero__main">
              <div class="welcome-hero__logo-section">
                <img :src="logoIconLightUrl" alt="in-SIGHT logo" class="welcome-hero__logo" />
              </div>
              <div class="welcome-hero__content">
                <div class="welcome-hero__avatar">
                  <v-icon icon="mdi-account" size="32" color="white" />
                </div>
                <div class="welcome-hero__text">
                  <p class="welcome-hero__greeting">Welcome back,</p>
                  <h1 class="welcome-hero__name">
                    {{ currentUser.profile?.displayName || currentUser.name }}
                  </h1>
                </div>
              </div>
              <div class="welcome-hero__actions">
                <v-btn
                  prepend-icon="mdi-account-circle-outline"
                  variant="tonal"
                  color="white"
                  size="small"
                  @click="showProfileModal = true"
                >Profile</v-btn>
                <v-btn
                  color="white"
                  variant="outlined"
                  prepend-icon="mdi-logout"
                  size="small"
                  @click="logout"
                >Log Out</v-btn>
              </div>
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

const brandingBase = `${useRuntimeConfig().app.baseURL}branding/`
// Single artwork that fills the branded side of the auth page on both desktop and mobile.
const loginHeroUrl = `${brandingBase}login-hero.svg`
const logoIconLightUrl = `${brandingBase}logo-icon-light.png`
const { currentUser, isAdmin, isClientAdmin, isClientTechnician, initAuth, login, logout } = useAuth()
const { addRequest } = useServiceRequests()
const { getRecords } = useRecords()

const formMessage = ref('')
const showLoginPassword = ref(false)
const showProfileModal = ref(false)
const loginLoading = ref(false)

const loginForm = reactive({ username: '', password: '' })

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

const formMessageType = computed(() => {
  if (!formMessage.value) return 'error'
  const msg = formMessage.value.toLowerCase()
  if (msg.includes('success') || msg.includes('created')) return 'success'
  return 'error'
})


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
    adminOnly: false,
    clientAdminOnly: false,
    showToClientTechnician: true
  },
  {
    key: 'upload',
    title: 'Upload Photo',
    description: 'Attach photographic cleaning evidence directly to existing records.',
    icon: 'mdi-camera-plus-outline',
    color1: '#06b6d4',
    color2: '#0891b2',
    action: () => navigateTo('/upload'),
    adminOnly: false,
    clientAdminOnly: false,
    showToClientTechnician: true
  },
  {
    key: 'modules',
    title: 'View Modules',
    description: 'Access vehicle, equipment, and cleaning tracking modules.',
    icon: 'mdi-view-module-outline',
    color1: '#10b981',
    color2: '#059669',
    action: () => navigateTo('/modules'),
    adminOnly: false,
    clientAdminOnly: true,
    showToClientTechnician: false
  },
  {
    key: 'management',
    title: 'User Management',
    description: 'Manage your company users and module permissions.',
    icon: 'mdi-account-cog-outline',
    color1: '#f59e0b',
    color2: '#d97706',
    action: () => navigateTo('/dashboard/client-management'),
    adminOnly: false,
    clientAdminOnly: true,
    showToClientTechnician: false
  },
  {
    key: 'dashboard',
    title: 'Dashboards & Management',
    description: 'Access admin tools, manage records, run checklists and view reports.',
    icon: 'mdi-view-dashboard-outline',
    color1: '#7c3aed',
    color2: '#6d28d9',
    action: () => navigateTo('/dashboard'),
    adminOnly: true,
    clientAdminOnly: false,
    showToClientTechnician: false
  },
  {
    key: 'maintenance',
    title: 'Request Maintenance',
    description: 'Report a maintenance issue or cleaning request to your admin team.',
    icon: 'mdi-wrench-clock-outline',
    color1: '#ea580c',
    color2: '#c2410c',
    action: () => { showMaintenanceDialog.value = true },
    adminOnly: false,
    clientAdminOnly: false,
    showToClientTechnician: false
  },
])

const visibleActions = computed(() =>
  allActions.value.filter(a => {
    // For client technicians, only show actions marked for them
    if (isClientTechnician.value) {
      return a.showToClientTechnician === true
    }
    // For other roles, use the original filtering logic
    if (a.adminOnly && !isAdmin.value) return false
    if (a.clientAdminOnly && !isClientAdmin.value) return false
    return true
  })
)

onMounted(() => { initAuth() })

const submitLogin = async () => {
  if (loginLoading.value) return
  if (!loginForm.username.trim() || !loginForm.password.trim()) {
    formMessage.value = 'Please enter both username and password.'
    return
  }
  
  loginLoading.value = true
  formMessage.value = ''
  
  try {
    const result = await login(loginForm.username, loginForm.password)
    if (!result.ok) { 
      formMessage.value = result.message || 'Login failed. Please check your username and password.'
      return 
    }
    formMessage.value = ''
    loginForm.username = ''
    loginForm.password = ''
    
    // Route all users to the main landing screen after login.
    navigateTo('/')
  } catch (error) {
    formMessage.value = 'Connection error. Please check your internet and try again.'
  } finally {
    loginLoading.value = false
  }
}

const goToProfilePage = () => {
  showProfileModal.value = false
  navigateTo('/profile')
}
</script>

<style scoped>
/* Auth page wrapper */
.auth-page-wrap {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.03) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
}

/* Mobile: fill the page with the same deep-navy vignette as the hero artwork */
@media (max-width: 959px) {
  .auth-page-wrap {
    background:
      radial-gradient(ellipse 130% 80% at 50% 26%, #05095c 0%, #01031e 56%, #00000c 100%) !important;
  }
}

/* Prevent word breaking */
.no-break {
  white-space: nowrap;
  display: inline-block;
}

/* Mobile card: hidden on md+ */
.auth-mobile-wrap { display: block; }
@media (min-width: 960px) { .auth-mobile-wrap { display: none; } }

/* Branded artwork that replaces the info panel (desktop) / header block (mobile) */
.login-hero-img {
  display: block;
}

/* Mobile: artwork sits as a full-width header above the sign-in card. Sharp
   edges, no frame - it blends into the matching deep-navy page background. */
.mobile-hero-banner {
  width: 100%;
  max-width: 460px;
  margin: 0 auto 22px;
}

.login-hero-img--mobile {
  width: 100%;
  height: auto;
  /* Trim the artwork's generous top/bottom padding for a tighter crop. */
  aspect-ratio: 8 / 7;
  object-fit: cover;
  object-position: center;
}

.mobile-login-card {
  background: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.mobile-form-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

/* Button gradient styling */
.btn-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%) !important;
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.4) !important;
  transition: all 0.3s ease !important;
}

.btn-gradient:hover {
  box-shadow: 0 6px 20px rgba(var(--v-theme-primary), 0.5) !important;
  transform: translateY(-1px);
}

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

/* Image-only hero panel: the artwork fills the entire left-hand side, edge to edge */
.auth-split__hero--image {
  display: block !important;
  padding: 0 !important;
  gap: 0 !important;
  overflow: hidden;
}

.auth-split__hero--image .login-hero-img {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  object-fit: cover;
  object-position: center;
}

/* Welcome hero */
.welcome-hero {
  position: relative;
  min-height: 110px;
  overflow: hidden;
}

.welcome-hero__logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  flex-shrink: 0;
}

.welcome-hero__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  position: relative;
  overflow: hidden;
  min-height: 110px;
}

.welcome-hero__main::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.welcome-hero__main::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(29, 78, 216, 0.35) 0%, transparent 30%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.welcome-hero__content {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
  flex: 1;
}

.welcome-hero__avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: none;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  border: 3px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  position: relative;
}

.welcome-hero__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-hero__greeting {
  color: rgba(255,255,255,0.85);
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.02em;
}

.welcome-hero__name {
  font-size: clamp(1.3rem, 3vw, 1.8rem);
  font-weight: 800;
  color: #ffffff;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.welcome-hero__sub {
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
  margin-top: 2px;
}

.welcome-hero__logo {
  height: 126px;
  width: auto;
  max-width: 126px;
  object-fit: contain;
  display: block;
}

.welcome-hero__actions { 
  display: flex; 
  align-items: center; 
  gap: 6px;
  position: relative;
  z-index: 1;
}

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
  .welcome-hero { 
    min-height: auto;
  }
  .welcome-hero__logo-section {
    order: 0;
    position: absolute;
    top: 16px;
    left: 16px;
  }
  .welcome-hero__logo { 
    height: 134px;
    max-width: 134px;
  }
  .welcome-hero__main {
    padding: 20px 16px;
    min-height: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0;
    position: relative;
  }
  .welcome-hero__content { 
    gap: 8px;
    flex-direction: column;
    align-items: flex-start;
    width: auto;
    padding-top: 155px;
    padding-left: 0;
    flex: 0;
  }
  .welcome-hero__avatar { 
    display: none;
  }
  .welcome-hero__text {
    text-align: left;
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
  }
  .welcome-hero__greeting { 
    font-size: 0.75rem;
    margin-bottom: 2px;
  }
  .welcome-hero__name { 
    font-size: 1.35rem;
    word-break: break-word;
    line-height: 1.2;
  }
  .welcome-hero__actions {
    position: absolute;
    top: 16px;
    right: 16px;
    width: auto;
    justify-content: flex-end;
    gap: 8px;
    flex-direction: row;
  }
  .welcome-hero__actions .v-btn {
    width: auto;
    min-width: auto;
    font-size: 0.75rem;
    padding: 0 10px;
  }
}

@media (min-width: 600px) and (max-width: 960px) {
  .welcome-hero__content {
    gap: 18px;
  }
  .welcome-hero__logo {
    height: 119px;
    max-width: 119px;
  }
  .welcome-hero__avatar {
    width: 56px;
    height: 56px;
  }
}

/* Mobile login responsive improvements */
@media (max-width: 599px) {
  .mobile-hero-banner {
    max-width: 400px;
    margin-bottom: 18px;
  }
  .mobile-login-card {
    padding: 20px !important;
  }
  .mobile-form-icon {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 380px) {
  .auth-mobile-wrap .py-8 {
    padding-top: 24px !important;
    padding-bottom: 24px !important;
  }
  .mobile-hero-banner {
    max-width: 320px;
  }
}
</style>
