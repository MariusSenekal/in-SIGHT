<template>
  <div class="container">
    <v-card rounded="xl" elevation="3" class="mb-5 overflow-hidden">
      <div class="dash-hero">
        <div class="d-flex align-center ga-3">
          <div class="dash-hero__icon">
            <v-icon icon="mdi-view-dashboard-outline" size="28" color="white" />
          </div>
          <div>
            <h1 class="text-h5 text-md-h4 font-weight-bold text-white">Dashboards & Management</h1>
            <p class="text-caption text-white" style="opacity:0.8">Quick cards and checklist tools to manage daily operations.</p>
          </div>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn color="white" variant="tonal" prepend-icon="mdi-arrow-left" size="small" @click="navigateTo('/')">Back</v-btn>
          <v-btn color="white" variant="outlined" prepend-icon="mdi-logout" size="small" @click="handleLogout">Log Out</v-btn>
        </div>
      </div>
    </v-card>

    <!-- Quick action cards -->
    <v-row dense class="mb-5">
      <v-col cols="12" sm="6" lg="3" v-for="item in quickActions" :key="item.to">
        <v-card :to="item.to" rounded="xl" elevation="2" class="dash-action-card cursor-pointer h-100">
          <div class="dash-action-card__strip" />
          <v-card-text class="pa-4">
            <div class="d-flex align-center ga-3 mb-2">
              <div class="dash-action-card__icon">
                <v-icon :icon="item.icon" color="primary" size="22" />
              </div>
              <h3 class="text-subtitle-2 font-weight-bold">{{ item.title }}</h3>
            </div>
            <p class="text-body-2 text-medium-emphasis">{{ item.description }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card rounded="xl" elevation="2">
      <div class="card-accent-top" />
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-1">
          <v-icon icon="mdi-format-list-checks" color="primary" size="22" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Quick To-Do List Builder</h2>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">Create checklist tasks using an easy add/edit/remove workflow.</p>

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
  </div>
</template>

<script setup lang="ts">
const { currentUser, isAdmin, initAuth, logout } = useAuth()
const { goBack } = useAppNavigation()
const { records: allRecords, loadRecords } = useRecords()
const { getChecklistTemplate, setChecklistTemplate } = useScheduleTracking()
const selectedRecordCode = ref('')
const quickTasks = ref<string[]>([])
const quickTaskInput = ref('')
const quickChecklistFeedback = ref('')

const allQuickActions = [
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
    icon: 'mdi-qrcode',
    adminOnly: true  // Only true admins can access QR codes
  },
  {
    to: '/dashboard/requests',
    title: 'Service Requests',
    description: 'Review maintenance and cleaning requests.',
    icon: 'mdi-clipboard-list-outline'
  }
]

// Filter quick actions - only show admin-only items to true admins
const quickActions = computed(() => 
  allQuickActions.filter(action => !action.adminOnly || isAdmin.value)
)

const recordSelectItems = computed(() => {
  return allRecords.value.map(record => ({
    label: `${record.code} - ${record.name}`,
    value: record.code
  }))
})

const loadChecklistForRecord = async () => {
  if (!selectedRecordCode.value) {
    return
  }

  quickTasks.value = [...(await getChecklistTemplate(selectedRecordCode.value)).tasks]
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

const saveQuickChecklist = async () => {
  if (!selectedRecordCode.value) {
    quickChecklistFeedback.value = 'Please choose a record first.'
    return
  }

  const cleanedTasks = quickTasks.value
    .map(task => task.trim())
    .filter(task => Boolean(task))

  setChecklistTemplate(selectedRecordCode.value, cleanedTasks, currentUser.value?.name || 'Admin')
  quickTasks.value = [...(await getChecklistTemplate(selectedRecordCode.value)).tasks]
  quickChecklistFeedback.value = 'Checklist saved. Staff will now see this task list in Service Details.'
}

onMounted(async () => {
  await initAuth()
  await loadRecords()

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

<style scoped>
.dash-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
}

.dash-hero__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  flex-shrink: 0;
}

.dash-action-card {
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  overflow: hidden;
}

.dash-action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.1) !important;
}

.dash-action-card__strip {
  height: 3px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
}

.dash-action-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-accent-top {
  height: 3px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  border-radius: 12px 12px 0 0;
}

@media (max-width: 599px) {
  .dash-hero { padding: 16px; }
}
</style>
