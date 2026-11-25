<template>
  <SettingsLayout active-tab="notifications">

    <!-- ── Push notifications (device) ───────────────────────────────── -->
    <v-card rounded="xl" elevation="2" class="mb-5">
      <div class="card-top-strip" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon icon="mdi-bell-outline" color="primary" size="24" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Push Notifications</h2>
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

        <v-expansion-panels class="mt-4" variant="accordion">
          <v-expansion-panel title="Diagnostics" bg-color="transparent">
            <v-expansion-panel-text>
              <div class="text-caption" style="font-family: monospace; white-space: pre-wrap;">{{ pushDiagnostics }}</div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>

    <!-- ── Reminder preferences ──────────────────────────────────────── -->
    <v-card rounded="xl" elevation="2">
      <div class="card-top-strip" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-1">
          <v-icon icon="mdi-tune-variant" color="primary" size="24" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Reminder Settings</h2>
        </div>
        <p class="text-medium-emphasis text-body-2 mb-4">
          Choose which reminders you get, how many days ahead, and what time of day
          (always South African time, SAST) they're sent. Only shown for modules you have access to.
        </p>

        <v-skeleton-loader v-if="!loaded" type="article, article" />

        <template v-else>
          <p v-if="visibleTypes.length === 0" class="text-medium-emphasis text-body-2">
            You don't have access to any module with reminder settings yet.
          </p>

          <div
            v-for="(def, index) in visibleTypes"
            :key="def.type"
            class="reminder-row"
            :class="{ 'reminder-row--first': index === 0 }"
          >
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
              <div class="d-flex align-center ga-2">
                <v-icon :icon="def.icon" :color="def.color" size="22" />
                <div>
                  <div class="text-body-1 font-weight-bold">{{ def.label }}</div>
                  <div class="text-caption text-medium-emphasis">{{ def.description }}</div>
                </div>
              </div>
              <v-switch
                v-model="form[def.type].enabled"
                color="primary"
                density="comfortable"
                hide-details
                inset
              />
            </div>

            <v-expand-transition>
              <div v-if="form[def.type].enabled" class="pl-1 pl-sm-9">
                <v-row dense>
                  <v-col cols="12" sm="7">
                    <v-select
                      v-model="form[def.type].intervalDays"
                      :items="intervalOptionsFor(def.type)"
                      label="Remind me"
                      variant="outlined"
                      density="comfortable"
                      multiple
                      chips
                      closable-chips
                      prepend-inner-icon="mdi-calendar-clock-outline"
                    />
                  </v-col>
                  <v-col cols="12" sm="5">
                    <v-text-field
                      v-model="form[def.type].sendTimeSast"
                      type="time"
                      label="Send time (SAST)"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-clock-outline"
                      hint="South African Standard Time, UTC+2"
                      persistent-hint
                    />
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </div>

          <v-btn
            v-if="visibleTypes.length"
            color="primary"
            variant="flat"
            prepend-icon="mdi-content-save"
            size="large"
            class="mt-2 btn-gradient"
            :loading="saving"
            @click="savePreferences"
          >
            Save Reminder Settings
          </v-btn>

          <v-alert
            v-if="saveMessage"
            type="success"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mt-3"
          >
            {{ saveMessage }}
          </v-alert>
        </template>
      </v-card-text>
    </v-card>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

type NotificationType = 'next_service_due' | 'contract_renewal' | 'birthday'

interface PreferenceForm {
  enabled: boolean
  intervalDays: number[]
  sendTimeSast: string
}

const { currentUser, initAuth, hasModuleAccess, loadUserModules, modulesLoaded } = useAuth()
const {
  isSupported: pushIsSupported,
  requestPermissionAndSubscribe,
  isSubscribed: pushIsSubscribed,
  unsubscribe: pushUnsubscribe
} = usePushNotifications()

// ── Type definitions, each gated by the module(s) it depends on ─────────────
const TYPE_DEFS: Array<{
  type: NotificationType
  label: string
  description: string
  icon: string
  color: string
  requiresModule: (() => boolean)
  intervalChoices: number[]
}> = [
  {
    type: 'next_service_due',
    label: 'Service Due',
    description: "A client's next service date is approaching.",
    icon: 'mdi-broom',
    color: '#005BAA',
    requiresModule: () => hasModuleAccess('clients'),
    intervalChoices: [90, 30, 14, 7, 1]
  },
  {
    type: 'contract_renewal',
    label: 'Contract Renewal',
    description: "A client's contract is coming up for renewal.",
    icon: 'mdi-file-document-outline',
    color: '#ED6C02',
    requiresModule: () => hasModuleAccess('clients'),
    intervalChoices: [90, 30, 14, 7, 1]
  },
  {
    type: 'birthday',
    label: 'Birthdays',
    description: 'A client or HR record has a birthday coming up.',
    icon: 'mdi-cake-variant-outline',
    color: '#7B1FA2',
    requiresModule: () => hasModuleAccess('clients') || hasModuleAccess('hr'),
    intervalChoices: [7, 3, 1, 0]
  }
]

const loaded = ref(false)
const saving = ref(false)
const saveMessage = ref('')

const form = reactive<Record<NotificationType, PreferenceForm>>({
  next_service_due: { enabled: true, intervalDays: [90, 30, 1], sendTimeSast: '10:00' },
  contract_renewal: { enabled: true, intervalDays: [90, 30, 1], sendTimeSast: '10:00' },
  birthday: { enabled: true, intervalDays: [1, 0], sendTimeSast: '10:00' }
})

const visibleTypes = computed(() => TYPE_DEFS.filter((def) => def.requiresModule()))

const intervalOptionsFor = (type: NotificationType) => {
  const def = TYPE_DEFS.find((d) => d.type === type)!
  return def.intervalChoices.map((days) => ({
    title: days === 0 ? 'On the day' : days === 1 ? '1 day before' : `${days} days before`,
    value: days
  }))
}

const loadPreferences = async () => {
  try {
    const rows = await $fetch<Array<{ type: NotificationType; enabled: boolean; intervalDays: number[]; sendTimeSast: string }>>('/api/notification-preferences')
    for (const row of rows) {
      form[row.type] = {
        enabled: row.enabled,
        intervalDays: row.intervalDays,
        sendTimeSast: row.sendTimeSast
      }
    }
  } catch {
    // Keep defaults -- the save button will create rows on first save.
  } finally {
    loaded.value = true
  }
}

const savePreferences = async () => {
  saving.value = true
  saveMessage.value = ''
  try {
    const body = visibleTypes.value.map((def) => ({
      type: def.type,
      enabled: form[def.type].enabled,
      intervalDays: form[def.type].intervalDays,
      sendTimeSast: form[def.type].sendTimeSast
    }))
    await $fetch('/api/notification-preferences', { method: 'PUT', body })
    saveMessage.value = 'Reminder settings saved.'
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch {
    saveMessage.value = ''
  } finally {
    saving.value = false
  }
}

// ── Push (device) notifications ─────────────────────────────────────────────
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

onMounted(async () => {
  await initAuth()
  if (!currentUser.value) {
    navigateTo('/')
    return
  }
  if (!modulesLoaded.value) await loadUserModules()

  refreshPushPermission()
  buildDiagnostics('page opened')
  loadPreferences()
})
</script>

<style scoped>
.card-top-strip {
  height: 3px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  border-radius: 12px 12px 0 0;
}

.reminder-row {
  padding: 16px 0;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.reminder-row--first {
  border-top: none;
  padding-top: 4px;
}
</style>
