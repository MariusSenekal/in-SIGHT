<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="9" xl="8">
        
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
        </div>

        <!-- Equipment details -->
        <template v-else-if="equipment">
          <!-- Page header -->
          <div class="d-flex align-center mb-5">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="handleBack"
              class="mr-2"
            />
            <div>
              <h1 class="text-h4 font-weight-bold">Equipment Tracking</h1>
              <p class="text-h6 mb-1">{{ equipment.make }} {{ equipment.model || equipment.name }}</p>
              <p class="text-medium-emphasis mb-0">{{ equipment.year ? equipment.year + ' • ' : '' }}{{ equipment.code }}</p>
            </div>
          </div>

          <!-- Equipment information card -->
          <v-card rounded="xl" elevation="2" class="mb-4">
            <v-card-title class="pa-5 pb-3">
              <div class="d-flex align-center ga-2">
                <v-icon icon="mdi-information" color="primary" />
                Equipment Information
              </div>
            </v-card-title>
            <v-card-text class="pa-5 pt-1">
              <v-row dense>
                <v-col cols="12" sm="6" md="4" v-for="field in equipmentFields" :key="field.key">
                  <div class="info-field">
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-icon :icon="field.icon" size="18" color="primary" />
                      <span class="text-body-2 text-medium-emphasis">{{ field.label }}</span>
                    </div>
                    <p class="text-body-1 font-weight-medium ml-7">
                      {{ field.value || '—' }}
                    </p>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions class="px-5 pb-4">
              <v-row dense class="flex-column">
                <v-col cols="12">
                  <v-btn
                    block
                    variant="flat"
                    color="primary"
                    prepend-icon="mdi-pencil"
                    @click="showEditDialog = true"
                  >
                    Edit Specifications
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <v-btn
                    block
                    variant="outlined"
                    color="error"
                    prepend-icon="mdi-history"
                    @click="showServiceHistory = true"
                  >
                    View Service History
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-actions>
          </v-card>

        </template>

        <!-- Error state -->
        <v-card v-else rounded="xl" elevation="2" class="pa-8 text-center">
          <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4" />
          <h3 class="text-h6 mb-2">Equipment not found</h3>
          <p class="text-medium-emphasis mb-4">The equipment you're looking for doesn't exist or you don't have access to it.</p>
          <v-btn color="primary" @click="navigateTo('/modules/equipment')">
            Back to Equipment
          </v-btn>
        </v-card>

      </v-col>
    </v-row>

    <!-- Edit Equipment Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-pencil" color="primary" />
            Edit Equipment Specifications
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <v-form ref="editForm" @submit.prevent="submitEdit">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.make"
                  label="Make *"
                  prepend-inner-icon="mdi-tag"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.model"
                  label="Model"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.year"
                  label="Year"
                  type="number"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.colour"
                  label="Colour"
                  prepend-inner-icon="mdi-palette"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.serialNumber"
                  label="Serial Number"
                  prepend-inner-icon="mdi-barcode"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.unitAllocation"
                  label="Unit Allocation"
                  prepend-inner-icon="mdi-office-building"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.nextServiceDue"
                  label="Next Service Due"
                  type="date"
                  prepend-inner-icon="mdi-wrench-clock"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <v-alert v-if="editFeedback" :type="editFeedbackType" variant="tonal" density="compact" class="mt-3">
              {{ editFeedback }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            prepend-icon="mdi-check" 
            @click="submitEdit"
            :loading="editLoading"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Service History Dialog -->
    <v-dialog v-model="showServiceHistory" max-width="1100">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-history" color="primary" />
            Service History
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1" style="max-height: 600px; overflow-y: auto;">
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
                  <td>{{ formatDateTime(entry.service_datetime || entry.maintenance_date || entry.created_at) }}</td>
                  <td>{{ entry.repair_completed || entry.description || entry.maintenance_type }}</td>
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
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showServiceHistory = false">Close</v-btn>
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
        <v-card-text class="pa-5 pt-1">
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
                        <v-col cols="12" sm="6">
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
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const route = useRoute()
const { authToken, isAdmin } = useAuth()
const equipmentId = computed(() => route.params.id as string)

interface Equipment {
  id: number
  code: string
  name: string
  make: string
  model: string
  year: number | null
  colour: string
  serial_number: string
  unit_allocation: string
  next_service_due: string | null
  category: string
  location: string
  status: string
  notes: string
}

interface ServiceHistory {
  id: number
  maintenance_date: string
  service_datetime?: string
  maintenance_type: string
  description: string
  repair_completed?: string
  cost: number | null
  performed_by: string
  notes: string
  created_at: string
}

const equipment = ref<Equipment | null>(null)
const serviceHistory = ref<ServiceHistory[]>([])
const loading = ref(true)
const historyLoading = ref(false)
const showEditDialog = ref(false)
const showServiceHistory = ref(false)
const showAddServiceDialog = ref(false)
const editLoading = ref(false)
const editFeedback = ref('')
const editFeedbackType = ref<'success' | 'error'>('success')
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

const editForm = reactive({
  make: '',
  model: '',
  year: null as number | null,
  colour: '',
  serialNumber: '',
  unitAllocation: '',
  nextServiceDue: ''
})

const serviceForm = reactive({
  serviceDate: '',
  serviceTime: '',
  repairCompleted: '',
  performedBy: '',
  cost: null as number | null,
  notes: ''
})

const equipmentFields = computed(() => {
  if (!equipment.value) return []
  return [
    { key: 'code', label: 'QR Code', icon: 'mdi-qrcode', value: equipment.value.code },
    { key: 'make', label: 'Make', icon: 'mdi-tag', value: equipment.value.make },
    { key: 'model', label: 'Model', icon: 'mdi-shape', value: equipment.value.model },
    { key: 'year', label: 'Year', icon: 'mdi-calendar', value: equipment.value.year },
    { key: 'colour', label: 'Colour', icon: 'mdi-palette', value: equipment.value.colour },
    { key: 'serial', label: 'Serial Number', icon: 'mdi-barcode', value: equipment.value.serial_number },
    { key: 'unit', label: 'Unit Allocation', icon: 'mdi-office-building', value: equipment.value.unit_allocation },
    { 
      key: 'service', 
      label: 'Next Service Due', 
      icon: 'mdi-wrench-clock', 
      value: equipment.value.next_service_due ? formatDate(equipment.value.next_service_due) : null 
    }
  ]
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

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
    // Format as YYYY-MM-DD for the serviceForm.serviceDate
    const year = newDate.getFullYear()
    const month = (newDate.getMonth() + 1).toString().padStart(2, '0')
    const day = newDate.getDate().toString().padStart(2, '0')
    serviceForm.serviceDate = `${year}-${month}-${day}`
  }
})

// Watch timeHour and timeMinute to always keep serviceForm.serviceTime in sync
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
  // Set serviceTime to match the rounded time values
  serviceForm.serviceTime = `${timeHour.value}:${timeMinute.value}`
  serviceForm.repairCompleted = ''
  serviceForm.performedBy = ''
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
  
  // Parse the datetime or use maintenance_date
  const dateTime = entry.service_datetime || entry.maintenance_date || entry.created_at
  const date = new Date(dateTime)
  
  serviceForm.serviceDate = date.toISOString().split('T')[0]
  serviceFormDate.value = date
  timeHour.value = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes()
  timeMinute.value = (Math.round(minutes / 5) * 5).toString().padStart(2, '0')
  // Set serviceTime to match the rounded time values
  serviceForm.serviceTime = `${timeHour.value}:${timeMinute.value}`
  selectingHour.value = true
  serviceForm.repairCompleted = entry.repair_completed || entry.description || entry.maintenance_type
  serviceForm.performedBy = entry.performed_by
  serviceForm.cost = entry.cost
  serviceForm.notes = entry.notes
  
  showAddServiceDialog.value = true
}

const handleBack = () => {
  // If admin came from management tools, route back to management
  if (isAdmin.value && route.query.from === 'management') {
    navigateTo('/dashboard/management')
    return
  }
  // If admin came from records dashboard, route back to records
  if (isAdmin.value && route.query.from === 'records') {
    navigateTo('/records')
    return
  }
  // Otherwise go to equipment list
  navigateTo('/modules/equipment')
}

const loadEquipment = async () => {
  loading.value = true
  try {
    equipment.value = await $fetch<Equipment>(`/api/equipment/${equipmentId.value}`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    // Populate edit form
    if (equipment.value) {
      editForm.make = equipment.value.make
      editForm.model = equipment.value.model || ''
      editForm.year = equipment.value.year
      editForm.colour = equipment.value.colour || ''
      editForm.serialNumber = equipment.value.serial_number || ''
      editForm.unitAllocation = equipment.value.unit_allocation || ''
      editForm.nextServiceDue = equipment.value.next_service_due || ''
    }
  } catch (error) {
    console.error('Failed to load equipment:', error)
    equipment.value = null
  } finally {
    loading.value = false
  }
}

const loadServiceHistory = async () => {
  historyLoading.value = true
  try {
    serviceHistory.value = await $fetch<ServiceHistory[]>(`/api/equipment/${equipmentId.value}/service-history`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
  } catch (error) {
    console.error('Failed to load service history:', error)
  } finally {
    historyLoading.value = false
  }
}

const submitEdit = async () => {
  if (!editForm.make) {
    editFeedback.value = 'Please fill in the Make field (required).'
    editFeedbackType.value = 'error'
    return
  }

  editLoading.value = true
  editFeedback.value = ''

  try {
    await $fetch(`/api/equipment/${equipmentId.value}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: editForm
    })
    editFeedback.value = 'Equipment updated successfully!'
    editFeedbackType.value = 'success'
    
    setTimeout(async () => {
      showEditDialog.value = false
      await loadEquipment()
      editFeedback.value = ''
    }, 1500)
  } catch (error) {
    editFeedback.value = 'Failed to update equipment. Please try again.'
    editFeedbackType.value = 'error'
  } finally {
    editLoading.value = false
  }
}

const submitService = async () => {
  // Debug: Log the form values
  console.log('Service form values:', {
    serviceDate: serviceForm.serviceDate,
    serviceTime: serviceForm.serviceTime,
    timeHour: timeHour.value,
    timeMinute: timeMinute.value,
    repairCompleted: serviceForm.repairCompleted,
    performedBy: serviceForm.performedBy
  })

  if (!serviceForm.serviceDate || !serviceForm.serviceTime || !serviceForm.repairCompleted || !serviceForm.performedBy) {
    serviceFeedback.value = 'Please fill in all required fields (Date, Time, Repair Completed, and Technician).'
    serviceFeedbackType.value = 'error'
    return
  }

  serviceLoading.value = true
  serviceFeedback.value = ''

  try {
    // Combine date and time into ISO datetime string with timezone
    const serviceDatetime = `${serviceForm.serviceDate}T${serviceForm.serviceTime}:00Z`
    
    console.log('[Frontend] Submitting service record:', {
      serviceDatetime,
      repairCompleted: serviceForm.repairCompleted,
      performedBy: serviceForm.performedBy,
      cost: serviceForm.cost,
      notes: serviceForm.notes
    })
    
    const body = {
      serviceDatetime,
      repairCompleted: serviceForm.repairCompleted,
      performedBy: serviceForm.performedBy,
      cost: serviceForm.cost,
      notes: serviceForm.notes
    }

    if (editingServiceId.value) {
      // Update existing service record
      await $fetch(`/api/equipment/${equipmentId.value}/service-history/${editingServiceId.value}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body
      })
      serviceFeedback.value = 'Service record updated successfully!'
    } else {
      // Create new service record
      await $fetch(`/api/equipment/${equipmentId.value}/service-history`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body
      })
      serviceFeedback.value = 'Service record added successfully!'
    }
    
    serviceFeedbackType.value = 'success'
    
    // Close dialog and refresh service history
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

watch(showServiceHistory, (val) => {
  if (val && serviceHistory.value.length === 0) {
    loadServiceHistory()
  }
})

onMounted(() => {
  loadEquipment()
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
</style>

<style scoped>
.info-field {
  padding: 8px 0;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
