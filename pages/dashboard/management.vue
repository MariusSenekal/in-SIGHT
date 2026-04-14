<template>
  <div class="container">
    <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">Management Tools</h1>
          <p class="text-medium-emphasis">Admin directory, QR records, checklist setup, and staff message visibility.</p>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn prepend-icon="mdi-arrow-left" variant="tonal" @click="goBack({ adminFallback: '/' })">Back</v-btn>
          <v-btn prepend-icon="mdi-logout" color="error" variant="flat" @click="handleLogout">Log Out</v-btn>
        </div>
      </div>

      <v-row class="mb-4" dense>
        <v-col cols="12" md="3" v-for="item in quickActions" :key="item.to">
          <v-card :to="item.to" class="h-100" variant="tonal" rounded="lg">
            <v-card-title class="d-flex align-center ga-2">
              <v-icon :icon="item.icon" />
              {{ item.title }}
            </v-card-title>
            <v-card-text class="text-medium-emphasis">{{ item.description }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="4">
          <v-card variant="outlined" rounded="lg">
            <v-card-title class="d-flex align-center justify-space-between">
              <span>All Users</span>
              <v-chip size="small" color="primary" variant="tonal">{{ filteredUsers.length }} / {{ users.length }}</v-chip>
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="userSearch"
                label="Search users"
                prepend-inner-icon="mdi-account-search"
                density="comfortable"
                variant="outlined"
                hide-details
                class="mb-3"
              />

              <v-list lines="two" class="user-list-vuetify" nav>
                <v-list-item
                  v-for="user in filteredUsers"
                  :key="user.id"
                  :active="selectedUserId === user.id"
                  rounded="lg"
                  @click="selectedUserId = user.id"
                >
                  <template #prepend>
                    <v-avatar color="primary" variant="tonal" size="34">
                      {{ (user.profile?.displayName || user.name).charAt(0).toUpperCase() }}
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ user.profile?.displayName || user.name }}</v-list-item-title>
                  <v-list-item-subtitle>@{{ user.username }} | {{ user.role }}</v-list-item-subtitle>

                  <template #append>
                    <v-chip size="x-small" color="info" variant="tonal">{{ getRecordCountForUser(user) }} QR</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <v-card v-if="selectedUser" variant="outlined" rounded="lg">
            <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-2">
              <span>{{ selectedUser.profile?.displayName || selectedUser.name }}</span>
              <v-chip size="small" color="secondary" variant="tonal">{{ selectedUser.role }}</v-chip>
            </v-card-title>

            <v-card-subtitle>
              Username: @{{ selectedUser.username }} | Default Site: {{ selectedUser.profile?.location || 'Not set' }}
            </v-card-subtitle>

            <v-card-text>
              <v-row dense class="mb-2">
                <v-col cols="12" md="6">
                  <v-select
                    v-model="siteFilter"
                    :items="siteFilterItems"
                    item-title="label"
                    item-value="value"
                    label="Filter by Site / Room"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="recordSearch"
                    label="Search records"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-alert
                v-if="filteredUserRecords.length === 0"
                type="info"
                variant="tonal"
                border="start"
                class="mb-2"
              >
                No QR records match this filter for the selected user.
              </v-alert>

              <v-row v-else dense>
                <v-col cols="12" v-for="record in filteredUserRecords" :key="record.id">
                  <v-card rounded="lg" variant="tonal" class="pa-2 pa-md-3">
                    <v-row>
                      <v-col cols="12" md="8">
                        <div class="d-flex flex-wrap align-center ga-2 mb-1">
                          <h3 class="text-h6 font-weight-bold">{{ record.name }}</h3>
                          <v-chip size="x-small" color="primary" variant="flat">{{ record.code }}</v-chip>
                          <v-chip size="x-small" color="info" variant="tonal">{{ record.type }}</v-chip>
                        </div>
                        <p class="text-medium-emphasis mb-3">Site / Room: {{ record.location }}</p>

                        <v-card variant="outlined" rounded="lg" class="mb-3">
                          <v-card-title class="text-subtitle-1 font-weight-bold">Schedule Checklist (Admin)</v-card-title>
                          <v-card-text>
                            <p class="text-medium-emphasis mb-2">Add tasks with buttons, then save. Staff will tick these in Service Details.</p>

                            <div class="d-grid ga-2 mb-2">
                              <div
                                v-for="(task, taskIndex) in getChecklistItems(record.code)"
                                :key="`${record.code}-${taskIndex}`"
                                class="d-flex flex-wrap ga-2"
                              >
                                <v-text-field
                                  :model-value="task"
                                  label="Task"
                                  density="compact"
                                  variant="outlined"
                                  hide-details
                                  class="flex-grow-1"
                                  @update:model-value="updateChecklistTask(record.code, taskIndex, String($event || ''))"
                                />
                                <v-btn
                                  color="error"
                                  variant="tonal"
                                  prepend-icon="mdi-delete-outline"
                                  @click="removeChecklistTask(record.code, taskIndex)"
                                >
                                  Remove
                                </v-btn>
                              </div>
                            </div>

                            <div class="d-flex flex-wrap ga-2 mb-2">
                              <v-text-field
                                v-model="newTaskByCode[record.code]"
                                label="Add new task"
                                density="compact"
                                variant="outlined"
                                hide-details
                                class="flex-grow-1"
                                @keydown.enter.prevent="addChecklistTask(record.code)"
                              />
                              <v-btn color="primary" prepend-icon="mdi-plus" @click="addChecklistTask(record.code)">Add Task</v-btn>
                            </div>

                            <v-btn color="success" prepend-icon="mdi-content-save" @click="saveChecklistForRecord(record.code)">
                              Save Checklist
                            </v-btn>
                          </v-card-text>
                        </v-card>

                        <v-card variant="outlined" rounded="lg">
                          <v-card-title class="text-subtitle-1 font-weight-bold">Latest Staff Results and Messages</v-card-title>
                          <v-card-text>
                            <v-alert
                              v-if="getRecentEntries(record.code).length === 0"
                              type="info"
                              variant="tonal"
                              border="start"
                            >
                              No service tracking entries yet.
                            </v-alert>

                            <v-expansion-panels v-else variant="accordion">
                              <v-expansion-panel
                                v-for="entry in getRecentEntries(record.code)"
                                :key="entry.id"
                              >
                                <v-expansion-panel-title>
                                  <div class="d-flex flex-wrap align-center ga-2 w-100">
                                    <span class="text-body-2 font-weight-medium">{{ entry.startTime }} -> {{ entry.endTime }}</span>
                                    <v-chip size="x-small" :color="statusColor(entry.status)" variant="tonal">{{ entry.status }}</v-chip>
                                    <v-spacer />
                                    <v-chip size="x-small" color="primary" variant="outlined">
                                      {{ entry.checklist.filter(task => task.completed).length }} / {{ entry.checklist.length }} completed
                                    </v-chip>
                                  </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                  <p class="text-medium-emphasis mb-2">{{ entry.notes }}</p>
                                  <v-divider class="my-2" />
                                  <p class="text-subtitle-2 mb-2">Thread</p>
                                  <v-alert
                                    v-if="entry.messages.length === 0"
                                    type="info"
                                    variant="tonal"
                                    density="compact"
                                  >
                                    No messages yet.
                                  </v-alert>
                                  <v-timeline v-else density="compact" side="end" align="start">
                                    <v-timeline-item
                                      v-for="message in entry.messages"
                                      :key="message.id"
                                      dot-color="primary"
                                      size="x-small"
                                    >
                                      <div class="text-body-2"><strong>{{ message.fromName }}</strong> ({{ message.fromRole }})</div>
                                      <div class="text-body-2">{{ message.text }}</div>
                                      <small class="text-medium-emphasis">{{ formatDateTime(message.createdAt) }}</small>
                                    </v-timeline-item>
                                  </v-timeline>
                                </v-expansion-panel-text>
                              </v-expansion-panel>
                            </v-expansion-panels>
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" md="4" class="d-flex flex-column align-center justify-center ga-3">
                        <v-card variant="outlined" rounded="lg" class="pa-2">
                          <QrcodeVue :value="toScanUrl(record.code)" :size="130" level="H" render-as="svg" />
                        </v-card>
                        <v-btn :to="`/scan/${record.code}`" color="primary" variant="flat" prepend-icon="mdi-open-in-new">
                          Open QR Site
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const { currentUser, isAdmin, initAuth, logout, users } = useAuth()
const { goBack } = useAppNavigation()
const { getRecords } = useRecords()
const { getChecklistTemplate, setChecklistTemplate, getEntriesByRecordCode } = useScheduleTracking()

const userSearch = ref('')
const recordSearch = ref('')
const siteFilter = ref('all')
const selectedUserId = ref<number | null>(null)
const checklistItemsByCode = ref<Record<string, string[]>>({})
const newTaskByCode = ref<Record<string, string>>({})

const quickActions = [
  {
    to: '/dashboard',
    title: 'Dashboard Home',
    description: 'Return to the admin dashboard overview.',
    icon: 'mdi-view-dashboard-outline'
  },
  {
    to: '/records',
    title: 'Record Access',
    description: 'Manage records and identifiers.',
    icon: 'mdi-folder-multiple-outline'
  },
  {
    to: '/dashboard/qr-codes',
    title: 'QR Code Section',
    description: 'Generate printable QR pages.',
    icon: 'mdi-qrcode'
  },
  {
    to: '/dashboard/requests',
    title: 'Service Requests',
    description: 'Review and resolve requests.',
    icon: 'mdi-clipboard-list-outline'
  }
]

const allRecords = computed(() => getRecords())

const filteredUsers = computed(() => {
  const term = userSearch.value.trim().toLowerCase()

  if (!term) {
    return users.value
  }

  return users.value.filter(user => {
    return [
      user.name,
      user.username,
      user.role,
      user.profile?.displayName || '',
      user.profile?.location || ''
    ].some(value => value.toLowerCase().includes(term))
  })
})

const selectedUser = computed(() => {
  if (!selectedUserId.value) {
    return filteredUsers.value[0] || null
  }

  return filteredUsers.value.find(user => user.id === selectedUserId.value) || filteredUsers.value[0] || null
})

const recordsForSelectedUser = computed(() => {
  if (!selectedUser.value) {
    return []
  }

  if (selectedUser.value.role === 'admin') {
    return allRecords.value.filter(record => record.ownerUserId === null)
  }

  return allRecords.value.filter(record => record.ownerUserId === selectedUser.value?.id)
})

const siteOptions = computed(() => {
  const options = new Set(recordsForSelectedUser.value.map(record => record.location))
  return [...options].sort((a, b) => a.localeCompare(b))
})

const siteFilterItems = computed(() => {
  return [
    { label: 'All sites', value: 'all' },
    ...siteOptions.value.map(site => ({ label: site, value: site }))
  ]
})

const filteredUserRecords = computed(() => {
  const term = recordSearch.value.trim().toLowerCase()

  return recordsForSelectedUser.value.filter(record => {
    const siteMatch = siteFilter.value === 'all' || record.location === siteFilter.value

    if (!siteMatch) {
      return false
    }

    if (!term) {
      return true
    }

    return [record.code, record.name, record.type, record.location]
      .some(value => value.toLowerCase().includes(term))
  })
})

const seedChecklistItems = (recordCode: string) => {
  if (checklistItemsByCode.value[recordCode] !== undefined) {
    return
  }

  const template = getChecklistTemplate(recordCode)
  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: [...template.tasks]
  }

  newTaskByCode.value = {
    ...newTaskByCode.value,
    [recordCode]: ''
  }
}

const getChecklistItems = (recordCode: string) => {
  seedChecklistItems(recordCode)
  return checklistItemsByCode.value[recordCode] || []
}

const updateChecklistTask = (recordCode: string, index: number, value: string) => {
  const current = [...getChecklistItems(recordCode)]
  current[index] = value

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: current
  }
}

const removeChecklistTask = (recordCode: string, index: number) => {
  const current = [...getChecklistItems(recordCode)]
  current.splice(index, 1)

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: current
  }
}

const addChecklistTask = (recordCode: string) => {
  const nextTask = (newTaskByCode.value[recordCode] || '').trim()

  if (!nextTask) {
    return
  }

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: [...getChecklistItems(recordCode), nextTask]
  }

  newTaskByCode.value = {
    ...newTaskByCode.value,
    [recordCode]: ''
  }
}

const saveChecklistForRecord = (recordCode: string) => {
  const tasks = getChecklistItems(recordCode)
    .map(task => task.trim())
    .filter(task => Boolean(task))

  setChecklistTemplate(recordCode, tasks, currentUser.value?.name || 'Admin')

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: [...getChecklistTemplate(recordCode).tasks]
  }
}

const getRecentEntries = (recordCode: string) => {
  return getEntriesByRecordCode(recordCode).slice(0, 3)
}

const statusColor = (status: string) => {
  if (status === 'Done') {
    return 'success'
  }

  if (status === 'Incomplete') {
    return 'warning'
  }

  return 'error'
}

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString()
}

const getRecordCountForUser = (user: (typeof users.value)[number]) => {
  if (user.role === 'admin') {
    return allRecords.value.filter(record => record.ownerUserId === null).length
  }

  return allRecords.value.filter(record => record.ownerUserId === user.id).length
}

watch(filteredUsers, (nextUsers) => {
  if (nextUsers.length === 0) {
    selectedUserId.value = null
    return
  }

  if (!nextUsers.some(user => user.id === selectedUserId.value)) {
    selectedUserId.value = nextUsers[0].id
  }
}, { immediate: true })

watch(selectedUserId, () => {
  siteFilter.value = 'all'
  recordSearch.value = ''
})

watch(filteredUserRecords, (records) => {
  records.forEach(record => seedChecklistItems(record.code))
}, { immediate: true })

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

const toScanUrl = (code: string) => {
  if (import.meta.client) {
    return `${window.location.origin}/scan/${code}`
  }

  return `/scan/${code}`
}
</script>

<style scoped>
.user-list-vuetify {
  max-height: 540px;
  overflow: auto;
}

@media (max-width: 960px) {
  .user-list-vuetify {
    max-height: 360px;
  }
}
</style>
