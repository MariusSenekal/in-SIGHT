<template>
  <DashboardLayout>
    <!-- Quick To-Do List Builder -->
        <v-card rounded="xl" elevation="2">
          <div class="card-accent-top" />
          <v-card-text class="pa-4 pa-sm-5">
            <div class="d-flex align-center ga-2 mb-1">
              <v-icon icon="mdi-format-list-checks" color="primary" size="22" />
              <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Quick To-Do List Builder</h2>
            </div>
            <p class="text-caption text-sm-body-2 text-medium-emphasis mb-3 mb-sm-4">Create checklist tasks using an easy add/edit/remove workflow.</p>

            <v-row dense>
              <v-col cols="12">
                <v-select
                  v-model="selectedRecordCode"
                  :items="recordSelectItems"
                  item-title="label"
                  item-value="value"
                  label="Select Record / Site"
                  prepend-inner-icon="mdi-map-marker-outline"
                  variant="outlined"
                  density="compact"
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
              density="compact"
              class="mt-3"
            >
              Select a record to begin creating its checklist.
            </v-alert>

            <div v-else class="mt-3 mt-sm-4 d-grid ga-2">
              <div v-for="(task, taskIndex) in quickTasks" :key="`${selectedRecordCode}-${taskIndex}`" class="d-flex flex-column flex-sm-row ga-2">
                <v-text-field
                  :model-value="task"
                  label="Task"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="flex-grow-1"
                  @update:model-value="updateQuickTask(taskIndex, String($event || ''))"
                />
                <v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline" size="small" @click="removeQuickTask(taskIndex)">
                  Remove
                </v-btn>
              </div>

              <div class="d-flex flex-column flex-sm-row ga-2">
                <v-text-field
                  v-model="quickTaskInput"
                  label="Add a new task"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="flex-grow-1"
                  @keydown.enter.prevent="addQuickTask"
                />
                <v-btn color="primary" prepend-icon="mdi-plus" size="small" @click="addQuickTask">Add Task</v-btn>
              </div>

              <div class="d-flex flex-wrap ga-2 align-center">
                <v-btn color="success" prepend-icon="mdi-content-save" size="small" @click="saveQuickChecklist">Save To-Do List</v-btn>
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
  </DashboardLayout>
</template>

<script setup lang="ts">
const { currentUser, isAdmin, initAuth } = useAuth()
const { records: allRecords, loadRecords } = useRecords()
const { getChecklistTemplate, setChecklistTemplate } = useScheduleTracking()
const selectedRecordCode = ref('')
const quickTasks = ref<string[]>([])
const quickTaskInput = ref('')
const quickChecklistFeedback = ref('')

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
