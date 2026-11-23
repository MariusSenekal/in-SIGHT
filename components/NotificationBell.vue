<template>
  <v-menu location="bottom end" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" icon variant="text" color="white">
        <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error">
          <v-icon :icon="unreadCount ? 'mdi-bell-ring-outline' : 'mdi-bell-outline'" />
        </v-badge>
      </v-btn>
    </template>

    <v-card class="notification-card" rounded="lg">
      <v-toolbar density="compact" color="surface">
        <v-toolbar-title class="text-subtitle-1">
          Notifications
          <span v-if="unreadCount" class="text-caption text-medium-emphasis ml-1">{{ unreadCount }} unread</span>
        </v-toolbar-title>
        <v-spacer />
        <v-btn v-if="unreadCount" size="small" variant="text" prepend-icon="mdi-check-all" @click="markAllRead">
          Mark all read
        </v-btn>
      </v-toolbar>
      <v-divider />

      <div v-if="notifications.length" class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'notification-item--unread': !notification.read_at }"
          :style="{ '--accent': styleFor(notification).color }"
          role="button"
          tabindex="0"
          @click="open(notification)"
          @keydown.enter="open(notification)"
        >
          <v-avatar :color="styleFor(notification).color" :variant="notification.read_at ? 'tonal' : 'flat'" size="38" class="flex-shrink-0">
            <v-icon :icon="styleFor(notification).icon" size="20" />
          </v-avatar>
          <div class="notification-text">
            <div class="d-flex align-center ga-2">
              <span class="type-label text-caption">{{ styleFor(notification).label }}</span>
              <v-spacer />
              <span class="text-caption text-medium-emphasis" :title="fullTime(notification.created_at)">
                {{ timeAgo(notification.created_at) }}
              </span>
              <span v-if="!notification.read_at" class="unread-dot" aria-label="Unread" />
            </div>
            <div class="notification-title text-body-2">{{ notification.title }}</div>
            <div class="notification-body text-caption text-medium-emphasis">{{ notification.body }}</div>
          </div>
        </div>
      </div>
      <v-card-text v-else class="text-medium-emphasis text-body-2 text-center py-8">
        <v-icon icon="mdi-bell-check-outline" size="36" class="mb-2 d-block mx-auto" />
        No notifications yet.
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications'

const { notifications, unreadCount, fetchAll, markRead, markAllRead, addLive } = useNotifications()
const { connect } = useSocket()
const router = useRouter()

const typeStyle: Record<AppNotification['type'], { color: string; icon: string; label: string }> = {
  next_service_due: { color: '#005BAA', icon: 'mdi-broom', label: 'Service due' },
  contract_renewal: { color: '#ED6C02', icon: 'mdi-file-document-outline', label: 'Contract renewal' },
  birthday: { color: '#7B1FA2', icon: 'mdi-cake-variant-outline', label: 'Birthday' }
}

const styleFor = (notification: AppNotification) =>
  typeStyle[notification.type] ?? { color: '#757575', icon: 'mdi-bell-outline', label: 'Notification' }

const fullTime = (value: string) =>
  new Date(value).toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const timeAgo = (value: string) => {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const open = async (notification: AppNotification) => {
  if (!notification.read_at) await markRead(notification.id)
  if (notification.link_type === 'clients') router.push('/modules/clients')
  else if (notification.link_type === 'hr') router.push('/modules/hr')
}

let socketListenerAttached = false

onMounted(() => {
  fetchAll()

  const socket = connect()
  if (!socketListenerAttached) {
    socket.on('new-notification', (notification: AppNotification) => addLive(notification))
    socketListenerAttached = true
  }
})
</script>

<style scoped>
.notification-card {
  width: 420px;
  max-width: calc(100vw - 24px);
}

.notification-list {
  max-height: min(480px, 65vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: 6px;
}

.notification-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 2px 8px;
  padding: 10px 10px 10px 12px;
  border-radius: 10px;
  border-left: 4px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s;
}

.notification-item:hover,
.notification-item:focus-visible {
  background: rgba(128, 128, 128, 0.08);
  outline: none;
}

.notification-item--unread {
  border-left-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 9%, transparent);
}

.notification-item--unread:hover {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}

.notification-text {
  flex: 1 1 auto;
  min-width: 0;
}

.type-label {
  color: var(--accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.notification-title {
  line-height: 1.35;
  margin-top: 1px;
}

.notification-item--unread .notification-title {
  font-weight: 600;
}

.notification-body {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 2px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}
</style>
