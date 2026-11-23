<template>
  <v-container class="py-4 py-md-6">

    <!-- ── Page hero header ───────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="3" class="mb-5 overflow-hidden">
      <div class="profile-hero">
        <div class="d-flex align-center ga-3">
          <div class="profile-hero__avatar">
            <v-icon icon="mdi-account" size="30" color="white" />
          </div>
          <div>
            <h1 class="text-h5 text-md-h4 font-weight-bold text-white">My Profile</h1>
            <p class="text-caption text-white" style="opacity:0.8">Manage your account details and personalise the app.</p>
          </div>
        </div>
        <v-btn variant="tonal" color="white" prepend-icon="mdi-arrow-left" size="small" @click="goBack()">Back</v-btn>
      </div>
    </v-card>

    <!-- ── Profile details ───────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="2" class="mb-5">
      <div class="card-top-strip" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-4">
          <v-icon icon="mdi-account-edit-outline" color="primary" size="24" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Profile Details</h2>
        </div>

        <v-form @submit.prevent="saveProfile">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="profileForm.displayName"
                label="Display Name"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-badge-account-outline"
                maxlength="60"
                required
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="profileForm.phone"
                label="Phone"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-phone-outline"
                maxlength="30"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="profileForm.location"
                label="Site / Room"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-map-marker-outline"
                maxlength="80"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-textarea
                v-model="profileForm.bio"
                label="Bio"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-text"
                rows="2"
                maxlength="180"
              />
            </v-col>
          </v-row>

          <v-btn type="submit" color="primary" prepend-icon="mdi-content-save" size="large" variant="flat" class="mt-1 btn-gradient">
            Save Profile
          </v-btn>
        </v-form>

        <v-alert
          v-if="profileMessage"
          type="success"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mt-3"
        >
          {{ profileMessage }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- ── Notifications ──────────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="2" class="mb-5">
      <div class="card-top-strip" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon icon="mdi-bell-outline" color="primary" size="24" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Notifications</h2>
        </div>

        <p class="text-body-2 text-medium-emphasis mb-3">
          Get alerted on this device for upcoming services, birthdays and contract renewals.
        </p>

        <div v-if="pushPermission === 'granted' && pushSubscribed" class="d-flex align-center ga-3 flex-wrap">
          <v-chip color="success" variant="tonal" prepend-icon="mdi-check-circle-outline">
            Notifications enabled on this device
          </v-chip>
          <v-btn
            variant="text"
            size="small"
            color="error"
            prepend-icon="mdi-bell-off-outline"
            :loading="disablingPush"
            @click="disablePushNotifications"
          >
            Disable
          </v-btn>
        </div>
        <v-btn
          v-else
          color="primary"
          variant="flat"
          prepend-icon="mdi-bell-ring-outline"
          class="btn-gradient"
          :loading="enablingPush"
          :disabled="pushPermission === 'denied' || !pushSupported"
          @click="enablePushNotifications"
        >
          Enable Notifications
        </v-btn>

        <v-alert
          v-if="pushPermission === 'denied'"
          type="warning"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mt-3"
        >
          Notifications are blocked for this site in your browser. Open your browser/app settings
          and allow notifications for in-SIGHT, then reload this page.
        </v-alert>
        <v-alert
          v-else-if="!pushSupported"
          type="info"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mt-3"
        >
          This browser doesn't support push notifications.
        </v-alert>
        <v-alert
          v-else-if="pushMessage"
          type="info"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mt-3"
        >
          {{ pushMessage }}
        </v-alert>

        <!-- Diagnostic readout so a failure can be screenshotted and reported
             exactly, instead of showing only "it didn't work". -->
        <v-expansion-panels class="mt-4" variant="accordion">
          <v-expansion-panel title="Diagnostics" bg-color="transparent">
            <v-expansion-panel-text>
              <div class="text-caption" style="font-family: monospace; white-space: pre-wrap;">{{ pushDiagnostics }}</div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>

    <!-- ── Theme picker ───────────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="2">
      <div class="card-top-strip" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-1">
          <v-icon icon="mdi-palette-outline" color="primary" size="24" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">App Theme</h2>
        </div>
        <p class="text-medium-emphasis text-body-2 mb-4">
          Pick a colour theme for the whole app. Your choice is saved automatically.
        </p>

        <!-- Light themes -->
        <p class="text-caption font-weight-bold text-uppercase mb-2" style="letter-spacing:0.08em; opacity:0.6">Light Themes</p>
        <v-row dense class="mb-4">
          <v-col
            v-for="option in lightThemes"
            :key="option.name"
            cols="6" sm="4" md="3"
          >
            <v-card
              rounded="lg"
              class="theme-swatch cursor-pointer"
              :class="{ 'theme-swatch--active': currentThemeName === option.name }"
              :style="currentThemeName === option.name
                ? `outline: 2.5px solid ${option.primary}; outline-offset: 2px; box-shadow: 0 4px 20px ${option.primary}40`
                : ''"
              variant="outlined"
              @click="applyTheme(option.name)"
            >
              <div
                class="theme-swatch__bar"
                :style="`background: linear-gradient(135deg, ${option.primary} 0%, ${option.secondary} 100%)`"
              />
              <v-card-text class="pa-2 pa-sm-3">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-body-2 font-weight-bold">{{ option.emoji }} {{ option.label }}</div>
                  </div>
                  <v-icon
                    v-if="currentThemeName === option.name"
                    icon="mdi-check-circle"
                    :color="option.primary"
                    size="18"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dark themes -->
        <p class="text-caption font-weight-bold text-uppercase mb-2" style="letter-spacing:0.08em; opacity:0.6">Dark Themes</p>
        <v-row dense>
          <v-col
            v-for="option in darkThemes"
            :key="option.name"
            cols="6" sm="4" md="3"
          >
            <v-card
              rounded="lg"
              class="theme-swatch cursor-pointer"
              :class="{ 'theme-swatch--active': currentThemeName === option.name }"
              :style="currentThemeName === option.name
                ? `outline: 2.5px solid ${option.primary}; outline-offset: 2px; box-shadow: 0 4px 20px ${option.primary}40`
                : ''"
              variant="outlined"
              @click="applyTheme(option.name)"
            >
              <div
                class="theme-swatch__bar"
                :style="`background: linear-gradient(135deg, ${option.primary} 0%, ${option.secondary} 100%)`"
              />
              <v-card-text class="pa-2 pa-sm-3">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-body-2 font-weight-bold">{{ option.emoji }} {{ option.label }}</div>
                  </div>
                  <v-icon
                    v-if="currentThemeName === option.name"
                    icon="mdi-check-circle"
                    :color="option.primary"
                    size="18"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

  </v-container>
</template>

<script setup lang="ts">
const { currentUser, initAuth, updateProfile } = useAuth()
const { goBack } = useAppNavigation()
const { currentThemeName, applyTheme, themeOptions } = useAppTheme()
const {
  isSupported: pushIsSupported,
  requestPermissionAndSubscribe,
  isSubscribed: pushIsSubscribed,
  unsubscribe: pushUnsubscribe
} = usePushNotifications()

const profileMessage = ref('')

// ── Notifications ────────────────────────────────────────────────────────
const pushSupported = ref(false)
const pushPermission = ref<NotificationPermission>('default')
const pushSubscribed = ref(false)
const enablingPush = ref(false)
const disablingPush = ref(false)
const pushMessage = ref('')
const pushDiagnostics = ref('Not checked yet.')

const buildDiagnostics = async (extra?: string) => {
  const lines: string[] = []
  lines.push(`timestamp: ${new Date().toISOString()}`)
  lines.push(`userAgent: ${navigator.userAgent}`)
  lines.push(`isSecureContext: ${window.isSecureContext}`)
  lines.push(`'serviceWorker' in navigator: ${'serviceWorker' in navigator}`)
  lines.push(`'PushManager' in window: ${'PushManager' in window}`)
  lines.push(`'Notification' in window: ${'Notification' in window}`)
  lines.push(`Notification.permission: ${('Notification' in window) ? Notification.permission : 'n/a'}`)
  lines.push(`displayMode standalone: ${window.matchMedia('(display-mode: standalone)').matches}`)
  lines.push(`displayMode fullscreen: ${window.matchMedia('(display-mode: fullscreen)').matches}`)
  lines.push(`location.href: ${window.location.href}`)
  const pwa = useNuxtApp().$pwa
  lines.push(`$pwa present: ${!!pwa}`)
  if (pwa) {
    lines.push(`$pwa.registrationError: ${pwa.registrationError?.value}`)
    lines.push(`$pwa.swActivated: ${pwa.swActivated?.value}`)
    lines.push(`$pwa.offlineReady: ${pwa.offlineReady?.value}`)
    lines.push(`$pwa.needRefresh: ${pwa.needRefresh?.value}`)
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations()
    lines.push(`SW registrations: ${regs.length}`)
    regs.forEach((r, i) => {
      lines.push(`  [${i}] scope=${r.scope} active=${r.active?.state ?? 'none'} waiting=${r.waiting?.state ?? 'none'} installing=${r.installing?.state ?? 'none'}`)
    })
  } catch (error) {
    lines.push(`SW registrations: error — ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    const swResp = await fetch('/sw.js', { cache: 'no-store' })
    lines.push(`/sw.js fetch: status=${swResp.status} content-type=${swResp.headers.get('content-type')}`)
  } catch (error) {
    lines.push(`/sw.js fetch: error — ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    const manual = await navigator.serviceWorker.register('/sw.js', { scope: '/', type: 'classic' })
    lines.push(`manual register() succeeded: scope=${manual.scope}`)
  } catch (error) {
    lines.push(`manual register() threw: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`)
  }
  try {
    const { publicKey } = await $fetch<{ publicKey: string }>('/api/push/public-key')
    lines.push(`server publicKey present: ${!!publicKey} (len ${publicKey?.length ?? 0})`)
  } catch (error) {
    lines.push(`server publicKey fetch: error — ${error instanceof Error ? error.message : String(error)}`)
  }
  if (extra) lines.push(`last action: ${extra}`)
  pushDiagnostics.value = lines.join('\n')
}

const refreshPushPermission = async () => {
  pushSupported.value = pushIsSupported()
  pushPermission.value = pushSupported.value ? Notification.permission : 'denied'
  pushSubscribed.value = pushSupported.value ? await pushIsSubscribed() : false
}

// Enable Notifications is a direct click handler -- requestPermission()
// must run as its very first synchronous step (no await ahead of it) or
// the browser silently skips the prompt instead of showing it.
const enablePushNotifications = async () => {
  enablingPush.value = true
  pushMessage.value = ''
  try {
    await requestPermissionAndSubscribe()
    await refreshPushPermission()
    if (pushPermission.value !== 'granted' || !pushSubscribed.value) {
      pushMessage.value = 'Notifications were not enabled. You can try again below.'
    }
    await buildDiagnostics('enable (no exception thrown)')
  } catch (error) {
    await refreshPushPermission()
    pushMessage.value = error instanceof Error ? error.message : 'Failed to enable notifications.'
    await buildDiagnostics(`enable threw: ${pushMessage.value}`)
  } finally {
    enablingPush.value = false
  }
}

const disablePushNotifications = async () => {
  disablingPush.value = true
  try {
    await pushUnsubscribe()
    await refreshPushPermission()
  } finally {
    disablingPush.value = false
  }
}

const lightThemes = computed(() => themeOptions.filter(t => !t.dark))
const darkThemes  = computed(() => themeOptions.filter(t => t.dark))

const profileForm = reactive({
  displayName: '',
  phone: '',
  location: '',
  bio: ''
})

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

  refreshPushPermission()
  buildDiagnostics('page opened')
})

const saveProfile = async () => {
  const result = await updateProfile({
    displayName: profileForm.displayName,
    phone: profileForm.phone,
    location: profileForm.location,
    bio: profileForm.bio
  })

  profileMessage.value = result.message
  setTimeout(() => { profileMessage.value = '' }, 3000)
}
</script>

<style scoped>
/* Profile hero */
.profile-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
}

.profile-hero__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

/* Card accent strip */
.card-top-strip {
  height: 3px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  border-radius: 12px 12px 0 0;
}

/* Theme swatches */
.theme-swatch__bar {
  height: 48px;
  border-radius: 6px 6px 0 0;
}

.theme-swatch {
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.theme-swatch:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
}

.theme-swatch--active {
  transform: translateY(-2px);
}
</style>
