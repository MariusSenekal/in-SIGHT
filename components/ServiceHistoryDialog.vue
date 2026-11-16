<template>
  <!-- Service History Dialog -->
  <v-dialog :model-value="modelValue" max-width="1100" @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-history" color="primary" />
          Service History
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-5" style="max-height: 600px; overflow-y: auto;">
        <!-- Loading service history -->
        <div v-if="historyLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" size="48" />
        </div>

        <!-- Empty service history -->
        <div v-else-if="serviceHistory.length === 0" class="text-center py-8">
          <v-icon icon="mdi-clipboard-text-off" size="48" color="grey-lighten-1" class="mb-2" />
          <p class="text-medium-emphasis mb-4">No service history yet</p>
          <v-btn
            color="error"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="showAddServiceDialog = true"
          >
            Update Service History
          </v-btn>
        </div>

        <!-- Service history table -->
        <div v-else>
          <v-table hover>
            <thead>
              <tr>
                <th class="text-left font-weight-bold">Date & Time</th>
                <th class="text-left font-weight-bold">Repair Completed</th>
                <th class="text-left font-weight-bold">Technician</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in serviceHistory"
                :key="entry.id"
                class="cursor-pointer"
                @click="editServiceEntry(entry)"
              >
                <td>{{ formatDateTime(entry.service_datetime || entry.maintenance_date || entry.service_date || entry.created_at) }}</td>
                <td>{{ entry.repair_completed || entry.description || entry.maintenance_type || entry.service_type }}</td>
                <td>{{ entry.performed_by || '—' }}</td>
              </tr>
            </tbody>
          </v-table>

          <div class="mt-4 text-center">
            <v-btn
              color="error"
              variant="flat"
              prepend-icon="mdi-plus"
              @click="showAddServiceDialog = true"
            >
              Update Service History
            </v-btn>
          </div>
        </div>
      </v-card-text>
      <v-divider />
      <v-card-actions class="px-5 py-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Add/Edit Service Dialog -->
  <v-dialog v-model="showAddServiceDialog" max-width="700">
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon :icon="editingServiceId ? 'mdi-pencil' : 'mdi-wrench-plus'" color="primary" />
          {{ editingServiceId ? 'Edit Service Record' : 'Add Service Record' }}
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-5">
        <v-form @submit.prevent="submitService">
          <v-row dense>
            <!-- Date Picker -->
            <v-col cols="12" sm="6">
              <v-menu
                v-model="datePickerMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    :model-value="formattedServiceDate"
                    label="Service Date *"
                    prepend-inner-icon="mdi-calendar"
                    readonly
                    variant="outlined"
                    density="comfortable"
                    v-bind="props"
                    hint="Click to select the date of service"
                    persistent-hint
                  />
                </template>
                <v-date-picker
                  v-model="serviceFormDate"
                  @update:model-value="datePickerMenu = false"
                  color="primary"
                  show-adjacent-months
                  hide-header
                />
              </v-menu>
            </v-col>
            <!-- Time Picker -->
            <v-col cols="12" sm="6">
              <v-menu
                v-model="timePickerMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    :model-value="displayedServiceTime"
                    label="Service Time *"
                    prepend-inner-icon="mdi-clock-outline"
                    readonly
                    variant="outlined"
                    density="comfortable"
                    v-bind="props"
                    hint="Click to select the time of service"
                    persistent-hint
                  />
                </template>
                <v-card class="time-picker-card">
                  <v-card-text class="pa-0">
                    <div class="time-picker-header primary pa-4">
                      <div class="time-display">
                        <span
                          class="time-part"
                          :class="{ 'time-part--active': selectingHour }"
                          @click="selectingHour = true"
                        >
                          {{ timeHour }}
                        </span>
                        <span class="time-separator">:</span>
                        <span
                          class="time-part"
                          :class="{ 'time-part--active': !selectingHour }"
                          @click="selectingHour = false"
                        >
                          {{ timeMinute }}
                        </span>
                      </div>
                    </div>

                    <div class="time-picker-body pa-4">
                      <!-- Hour Selection -->
                      <div v-if="selectingHour" class="time-grid">
                        <v-btn
                          v-for="hour in hours"
                          :key="hour"
                          :color="timeHour === hour ? 'primary' : undefined"
                          :variant="timeHour === hour ? 'flat' : 'text'"
                          class="time-grid-btn"
                          @click="setHour(hour)"
                        >
                          {{ hour }}
                        </v-btn>
                      </div>

                      <!-- Minute Selection -->
                      <div v-else class="time-grid">
                        <v-btn
                          v-for="minute in minuteOptions"
                          :key="minute"
                          :color="timeMinute === minute ? 'primary' : undefined"
                          :variant="timeMinute === minute ? 'flat' : 'text'"
                          class="time-grid-btn"
                          @click="setMinute(minute)"
                        >
                          {{ minute }}
                        </v-btn>
                      </div>
                    </div>

                    <v-divider />

                    <div class="pa-3 d-flex justify-end ga-2">
                      <v-btn
                        variant="text"
                        @click="timePickerMenu = false"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        color="primary"
                        variant="flat"
                        @click="confirmTime"
                      >
                        OK
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-menu>
            </v-col>
            <!-- Repair Completed -->
            <v-col cols="12">
              <v-textarea
                v-model="serviceForm.repairCompleted"
                label="Repair Completed *"
                prepend-inner-icon="mdi-wrench"
                variant="outlined"
                density="comfortable"
                rows="3"
                required
                placeholder="Describe what repairs or maintenance were completed..."
                hint="Detailed description of the work performed"
                persistent-hint
              />
            </v-col>
            <!-- Technician -->
            <v-col cols="12">
              <v-text-field
                v-model="serviceForm.performedBy"
                label="Technician *"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                density="comfortable"
                required
                placeholder="Name of technician who performed the service"
                hint="Enter the technician's name"
                persistent-hint
              />
            </v-col>

            <!-- Optional fields (collapsible) -->
            <v-col cols="12">
              <v-expansion-panels variant="accordion">
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-2">
                      <v-icon icon="mdi-information-outline" size="small" />
                      Additional Information (Optional)
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row dense class="mt-2">
                      <v-col v-if="module === 'vehicles'" cols="12" sm="6">
                        <v-text-field
                          v-model="serviceForm.odometerReading"
                          label="Odometer Reading (km)"
                          type="number"
                          prepend-inner-icon="mdi-speedometer"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" :sm="module === 'vehicles' ? 6 : 12">
                        <v-text-field
                          v-model="serviceForm.cost"
                          label="Cost (R)"
                          type="number"
                          step="0.01"
                          prepend-inner-icon="mdi-currency-usd"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-textarea
                          v-model="serviceForm.notes"
                          label="Additional Notes"
                          prepend-inner-icon="mdi-note-text"
                          variant="outlined"
                          density="comfortable"
                          rows="2"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
          <v-alert v-if="serviceFeedback" :type="serviceFeedbackType" variant="tonal" density="compact" class="mt-3">
            {{ serviceFeedback }}
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions class="px-5 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="closeServiceDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-check"
          @click="submitService"
          :loading="serviceLoading"
        >
          {{ editingServiceId ? 'Update' : 'Add' }} Service
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface ServiceHistory {
  id: number
  service_date?: string
  service_datetime?: string
  maintenance_date?: string
  service_type?: string
  maintenance_type?: string
  description?: string
  repair_completed?: string
  cost: number | null
  odometer_reading?: number | null
  performed_by: string
  notes: string
  created_at: string
}

const props = defineProps<{
  modelValue: boolean
  module: 'vehicles' | 'equipment'
  recordId: number | string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const serviceHistory = ref<ServiceHistory[]>([])
const historyLoading = ref(false)
const showAddServiceDialog = ref(false)
const serviceLoading = ref(false)
const serviceFeedback = ref('')
const serviceFeedbackType = ref<'success' | 'error'>('success')
const editingServiceId = ref<number | null>(null)
const datePickerMenu = ref(false)
const timePickerMenu = ref(false)
const serviceFormDate = ref<Date>(new Date())
const timeHour = ref('12')
const timeMinute = ref('00')
const selectingHour = ref(true)

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

const serviceForm = reactive({
  serviceDate: '',
  serviceTime: '',
  repairCompleted: '',
  performedBy: '',
  odometerReading: null as number | null,
  cost: null as number | null,
  notes: ''
})

const apiBase = computed(() => `/api/${props.module}/${props.recordId}/service-history`)

const formatDateTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr)
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const formattedServiceDate = computed(() => {
  if (!serviceForm.serviceDate) return ''
  const date = new Date(serviceForm.serviceDate)
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const displayedServiceTime = computed(() => {
  return `${timeHour.value}:${timeMinute.value}`
})

const setHour = (hour: string) => {
  timeHour.value = hour
  selectingHour.value = false
}

const setMinute = (minute: string) => {
  timeMinute.value = minute
}

const confirmTime = () => {
  timePickerMenu.value = false
  selectingHour.value = true
}

watch(serviceFormDate, (newDate) => {
  if (newDate) {
    const year = newDate.getFullYear()
    const month = (newDate.getMonth() + 1).toString().padStart(2, '0')
    const day = newDate.getDate().toString().padStart(2, '0')
    serviceForm.serviceDate = `${year}-${month}-${day}`
  }
})

watch([timeHour, timeMinute], ([hour, minute]) => {
  serviceForm.serviceTime = `${hour}:${minute}`
})

const resetServiceForm = () => {
  const now = new Date()
  serviceForm.serviceDate = now.toISOString().split('T')[0]
  serviceFormDate.value = now
  timeHour.value = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes()
  timeMinute.value = (Math.round(minutes / 5) * 5).toString().padStart(2, '0')
  serviceForm.serviceTime = `${timeHour.value}:${timeMinute.value}`
  serviceForm.repairCompleted = ''
  serviceForm.performedBy = ''
  serviceForm.odometerReading = null
  serviceForm.cost = null
  serviceForm.notes = ''
  editingServiceId.value = null
}

const closeServiceDialog = () => {
  showAddServiceDialog.value = false
  resetServiceForm()
  serviceFeedback.value = ''
}

const editServiceEntry = (entry: ServiceHistory) => {
  editingServiceId.value = entry.id

  const dateTime = entry.service_datetime || entry.maintenance_date || entry.service_date || entry.created_at
  const date = new Date(dateTime)

  serviceForm.serviceDate = date.toISOString().split('T')[0]
  serviceFormDate.value = date
  timeHour.value = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes()
  timeMinute.value = (Math.round(minutes / 5) * 5).toString().padStart(2, '0')
  serviceForm.serviceTime = `${timeHour.value}:${timeMinute.value}`
  selectingHour.value = true
  serviceForm.repairCompleted = entry.repair_completed || entry.description || entry.maintenance_type || entry.service_type || ''
  serviceForm.performedBy = entry.performed_by
  serviceForm.odometerReading = entry.odometer_reading ?? null
  serviceForm.cost = entry.cost
  serviceForm.notes = entry.notes

  showAddServiceDialog.value = true
}

const loadServiceHistory = async () => {
  historyLoading.value = true
  try {
    serviceHistory.value = await $fetch<ServiceHistory[]>(apiBase.value)
  } catch (error) {
    console.error('Failed to load service history:', error)
  } finally {
    historyLoading.value = false
  }
}

const submitService = async () => {
  if (!serviceForm.serviceDate || !serviceForm.serviceTime || !serviceForm.repairCompleted || !serviceForm.performedBy) {
    serviceFeedback.value = 'Please fill in all required fields.'
    serviceFeedbackType.value = 'error'
    return
  }

  serviceLoading.value = true
  serviceFeedback.value = ''

  try {
    const serviceDatetime = `${serviceForm.serviceDate}T${serviceForm.serviceTime}:00Z`

    const body = {
      serviceDatetime,
      repairCompleted: serviceForm.repairCompleted,
      performedBy: serviceForm.performedBy,
      odometerReading: props.module === 'vehicles' ? serviceForm.odometerReading : undefined,
      cost: serviceForm.cost,
      notes: serviceForm.notes
    }

    if (editingServiceId.value) {
      await $fetch(`${apiBase.value}/${editingServiceId.value}`, {
        method: 'PATCH',
        body
      })
      serviceFeedback.value = 'Service record updated successfully!'
    } else {
      await $fetch(apiBase.value, {
        method: 'POST',
        body
      })
      serviceFeedback.value = 'Service record added successfully!'
    }

    serviceFeedbackType.value = 'success'

    closeServiceDialog()
    await loadServiceHistory()
  } catch (error) {
    serviceFeedback.value = editingServiceId.value
      ? 'Failed to update service record. Please try again.'
      : 'Failed to add service record. Please try again.'
    serviceFeedbackType.value = 'error'
  } finally {
    serviceLoading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadServiceHistory()
  }
}, { immediate: true })

watch(() => props.recordId, () => {
  if (props.modelValue) {
    loadServiceHistory()
  }
})

onMounted(() => {
  resetServiceForm()
})
</script>

<style scoped>
/* Time Picker Styles */
.time-picker-card {
  min-width: 300px;
}

.time-picker-header {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.time-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 3rem;
  font-weight: 300;
  user-select: none;
}

.time-part {
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
}

.time-part--active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

.time-part:hover {
  background: rgba(255, 255, 255, 0.15);
}

.time-separator {
  opacity: 0.6;
}

.time-picker-body {
  min-height: 280px;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.time-grid-btn {
  aspect-ratio: 1;
  min-width: 0 !important;
  padding: 0 !important;
  font-size: 14px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
