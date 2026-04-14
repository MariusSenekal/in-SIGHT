<template>
  <div class="container">
    <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">Dashboards and Management</h1>
          <p class="text-medium-emphasis">Use quick cards and checklist tools to manage daily operations faster.</p>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn prepend-icon="mdi-arrow-left" variant="tonal" @click="goBack({ adminFallback: '/' })">Back</v-btn>
          <v-btn prepend-icon="mdi-logout" color="error" variant="flat" @click="handleLogout">Log Out</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="6" lg="3" v-for="item in quickActions" :key="item.to">
          <v-card :to="item.to" rounded="lg" variant="tonal" class="h-100">
            <v-card-title class="d-flex align-center ga-2">
              <v-icon :icon="item.icon" />
              {{ item.title }}
            </v-card-title>
            <v-card-text class="text-medium-emphasis">{{ item.description }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card variant="outlined" rounded="lg">
        <v-card-title class="text-h6 font-weight-bold">Quick To-Do List Builder</v-card-title>
        <v-card-subtitle>Create checklist tasks using an easy add/edit/remove workflow.</v-card-subtitle>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="7">
              <v-select
                v-model="selectedRecordCode"
                :items="recordSelectItems"
                item-title="label"
                item-value="value"
                label="Select Record / Site"
                prepend-inner-icon="mdi-map-marker-outline"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="loadChecklistForRecord"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="!selectedRecordCode"
            type="info"
            variant="tonal"
            border="start"
            class="mt-3"
          >
            Select a record to begin creating its checklist.
          </v-alert>

          <div v-else class="mt-4 d-grid ga-2">
            <div v-for="(task, taskIndex) in quickTasks" :key="`${selectedRecordCode}-${taskIndex}`" class="d-flex flex-wrap ga-2">
              <v-text-field
                :model-value="task"
                label="Task"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1"
                @update:model-value="updateQuickTask(taskIndex, String($event || ''))"
              />
              <v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline" @click="removeQuickTask(taskIndex)">
                Remove
              </v-btn>
            </div>

            <div class="d-flex flex-wrap ga-2">
              <v-text-field
                v-model="quickTaskInput"
                label="Add a new task"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1"
                @keydown.enter.prevent="addQuickTask"
              />
              <v-btn color="primary" prepend-icon="mdi-plus" @click="addQuickTask">Add Task</v-btn>
            </div>

            <div class="d-flex flex-wrap ga-2 align-center">
              <v-btn color="success" prepend-icon="mdi-content-save" @click="saveQuickChecklist">Save To-Do List</v-btn>
              <v-chip v-if="quickTasks.length" color="primary" variant="tonal" size="small">{{ quickTasks.length }} tasks</v-chip>
            </div>

            <v-alert
              v-if="quickChecklistFeedback"
              type="success"
              variant="tonal"
              density="compact"
              border="start"
            >
              {{ quickChecklistFeedback }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const { currentUser, isAdmin, initAuth, logout } = useAuth()
const { goBack } = useAppNavigation()
const { getRecords } = useRecords()
const { getChecklistTemplate, setChecklistTemplate } = useScheduleTracking()

const allRecords = computed(() => getRecords())
const selectedRecordCode = ref('')
const quickTasks = ref<string[]>([])
const quickTaskInput = ref('')
const quickChecklistFeedback = ref('')

const quickActions = [
  {
    to: '/dashboard/management',
    title: 'Management Tools',
    description: 'User directory, checklist assignment, and status tracking.',
    icon: 'mdi-account-cog-outline'
  },
  {
    to: '/records',
    title: 'Records Dashboard',
    description: 'Open and manage all cleaning records.',
    icon: 'mdi-folder-multiple-outline'
  },
  {
    to: '/dashboard/qr-codes',
    title: 'QR Code Section',
    description: 'Generate and print QR sheets for sites.',
    icon: 'mdi-qrcode'
  },
  {
    to: '/dashboard/requests',
    title: 'Service Requests',
    description: 'Review maintenance and cleaning requests.',
    icon: 'mdi-clipboard-list-outline'
  }
]

const recordSelectItems = computed(() => {
  return allRecords.value.map(record => ({
    label: `${record.code} - ${record.name}`,
    value: record.code
  }))
})

const loadChecklistForRecord = () => {
  if (!selectedRecordCode.value) {
    return
  }

  quickTasks.value = [...getChecklistTemplate(selectedRecordCode.value).tasks]
  quickChecklistFeedback.value = ''
}

const updateQuickTask = (index: number, value: string) => {
  const next = [...quickTasks.value]
  next[index] = value
  quickTasks.value = next
}

const addQuickTask = () => {
  const nextTask = quickTaskInput.value.trim()

  if (!nextTask) {
    return
  }

  quickTasks.value = [...quickTasks.value, nextTask]
  quickTaskInput.value = ''
}

const removeQuickTask = (index: number) => {
  const next = [...quickTasks.value]
  next.splice(index, 1)
  quickTasks.value = next
}

const saveQuickChecklist = () => {
  if (!selectedRecordCode.value) {
    quickChecklistFeedback.value = 'Please choose a record first.'
    return
  }

  const cleanedTasks = quickTasks.value
    .map(task => task.trim())
    .filter(task => Boolean(task))

  setChecklistTemplate(selectedRecordCode.value, cleanedTasks, currentUser.value?.name || 'Admin')
  quickTasks.value = [...getChecklistTemplate(selectedRecordCode.value).tasks]
  quickChecklistFeedback.value = 'Checklist saved. Staff will now see this task list in Service Details.'
}

onMounted(() => {
  initAuth()

  if (!currentUser.value || !isAdmin.value) {
    navigateTo('/')
  }

  const firstRecordCode = allRecords.value[0]?.code || ''
  selectedRecordCode.value = firstRecordCode

  if (firstRecordCode) {
    loadChecklistForRecord()
  }
})

const handleLogout = () => {
  logout()
  navigateTo('/')
}
</script>
