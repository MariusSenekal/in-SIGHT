<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="9" xl="8">
        
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
        </div>

        <!-- Vehicle details -->
        <template v-else-if="vehicle">
          <!-- Page header -->
          <div class="d-flex align-center mb-5">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="navigateTo('/modules/vehicles')"
              class="mr-2"
            />
            <div>
              <h1 class="text-h4 font-weight-bold">{{ vehicle.make }} {{ vehicle.model }}</h1>
              <p class="text-medium-emphasis mb-0">{{ vehicle.year }} • {{ vehicle.registration_number }}</p>
            </div>
          </div>

          <!-- Vehicle information card -->
          <v-card rounded="xl" elevation="2" class="mb-4">
            <v-card-title class="pa-5 pb-3">
              <div class="d-flex align-center ga-2">
                <v-icon icon="mdi-information" color="primary" />
                Vehicle Information
              </div>
            </v-card-title>
            <v-card-text class="pa-5 pt-1">
              <v-row dense>
                <v-col cols="12" sm="6" md="4" v-for="field in vehicleFields" :key="field.key">
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
          <h3 class="text-h6 mb-2">Vehicle not found</h3>
          <p class="text-medium-emphasis mb-4">The vehicle you're looking for doesn't exist or you don't have access to it.</p>
          <v-btn color="primary" @click="navigateTo('/modules/vehicles')">
            Back to Vehicles
          </v-btn>
        </v-card>

      </v-col>
    </v-row>

    <!-- Edit Vehicle Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-pencil" color="primary" />
            Edit Vehicle Specifications
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <v-form ref="editForm" @submit.prevent="submitEdit">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.make"
                  label="Make *"
                  prepend-inner-icon="mdi-car"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.model"
                  label="Model *"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.year"
                  label="Year *"
                  type="number"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                  required
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
                  v-model="editForm.registrationNumber"
                  label="Registration Number *"
                  prepend-inner-icon="mdi-card-text"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.vinNumber"
                  label="VIN #"
                  prepend-inner-icon="mdi-barcode"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.licenseDiscRenewal"
                  label="License Disc Renewal"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.nextServiceDueKm"
                  label="Next Service Due (km)"
                  type="number"
                  prepend-inner-icon="mdi-wrench"
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
    <v-dialog v-model="showServiceHistory" max-width="900">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-history" color="primary" />
              Service History
            </div>
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-plus"
              @click="showAddServiceDialog = true"
            >
              Add Service
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1" style="max-height: 500px; overflow-y: auto;">
          <!-- Loading service history -->
          <div v-if="historyLoading" class="text-center py-4">
            <v-progress-circular indeterminate color="primary" size="48" />
          </div>

          <!-- Empty service history -->
          <div v-else-if="serviceHistory.length === 0" class="text-center py-8">
            <v-icon icon="mdi-clipboard-text-off" size="48" color="grey-lighten-1" class="mb-2" />
            <p class="text-medium-emphasis">No service history yet</p>
          </div>

          <!-- Service history timeline -->
          <v-timeline v-else side="end" density="compact" class="mt-2">
            <v-timeline-item
              v-for="entry in serviceHistory"
              :key="entry.id"
              dot-color="primary"
              size="small"
            >
              <template v-slot:opposite>
                <div class="text-body-2 text-medium-emphasis">
                  {{ formatDate(entry.service_date) }}
                </div>
              </template>
              <v-card variant="outlined" rounded="lg">
                <v-card-text class="pa-3">
                  <div class="d-flex align-center ga-2 mb-1">
                    <v-icon icon="mdi-wrench" size="18" color="primary" />
                    <h4 class="text-subtitle-2 font-weight-bold">{{ entry.service_type }}</h4>
                  </div>
                  <p v-if="entry.description" class="text-body-2 mb-2">{{ entry.description }}</p>
                  <div class="d-flex flex-wrap ga-3 text-caption text-medium-emphasis">
                    <span v-if="entry.odometer_reading">
                      <v-icon icon="mdi-speedometer" size="14" />
                      {{ formatNumber(entry.odometer_reading) }} km
                    </span>
                    <span v-if="entry.cost">
                      <v-icon icon="mdi-currency-usd" size="14" />
                      R {{ entry.cost }}
                    </span>
                    <span v-if="entry.performed_by">
                      <v-icon icon="mdi-account" size="14" />
                      {{ entry.performed_by }}
                    </span>
                  </div>
                  <p v-if="entry.notes" class="text-caption text-medium-emphasis mt-2 mb-0">
                    Note: {{ entry.notes }}
                  </p>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showServiceHistory = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Service Dialog -->
    <v-dialog v-model="showAddServiceDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-wrench-plus" color="primary" />
            Add Service Record
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <v-form ref="serviceForm" @submit.prevent="submitAddService">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newService.serviceDate"
                  label="Service Date *"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newService.serviceType"
                  label="Service Type *"
                  prepend-inner-icon="mdi-wrench"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., Oil Change, Tire Rotation"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newService.description"
                  label="Description"
                  prepend-inner-icon="mdi-text"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newService.odometerReading"
                  label="Odometer Reading (km)"
                  type="number"
                  prepend-inner-icon="mdi-speedometer"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newService.cost"
                  label="Cost (R)"
                  type="number"
                  step="0.01"
                  prepend-inner-icon="mdi-currency-usd"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="newService.performedBy"
                  label="Performed By"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., ABC Auto Service"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newService.notes"
                  label="Additional Notes"
                  prepend-inner-icon="mdi-note-text"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                />
              </v-col>
            </v-row>
            <v-alert v-if="serviceFeedback" :type="serviceFeedbackType" variant="tonal" density="compact" class="mt-3">
              {{ serviceFeedback }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showAddServiceDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            prepend-icon="mdi-check" 
            @click="submitAddService"
            :loading="serviceLoading"
          >
            Add Service
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const route = useRoute()
const { authToken } = useAuth()
const vehicleId = computed(() => route.params.id as string)

interface Vehicle {
  id: number
  make: string
  model: string
  year: number
  colour: string
  registration_number: string
  vin_number: string
  license_disc_renewal: string | null
  next_service_due_km: number | null
}

interface ServiceHistory {
  id: number
  service_date: string
  service_type: string
  description: string
  cost: number | null
  odometer_reading: number | null
  performed_by: string
  notes: string
}

const vehicle = ref<Vehicle | null>(null)
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

const editForm = reactive({
  make: '',
  model: '',
  year: 0,
  colour: '',
  registrationNumber: '',
  vinNumber: '',
  licenseDiscRenewal: '',
  nextServiceDueKm: null as number | null
})

const newService = reactive({
  serviceDate: new Date().toISOString().split('T')[0],
  serviceType: '',
  description: '',
  odometerReading: null as number | null,
  cost: null as number | null,
  performedBy: '',
  notes: ''
})

const vehicleFields = computed(() => {
  if (!vehicle.value) return []
  return [
    { key: 'make', label: 'Make', icon: 'mdi-car', value: vehicle.value.make },
    { key: 'model', label: 'Model', icon: 'mdi-car-info', value: vehicle.value.model },
    { key: 'year', label: 'Year', icon: 'mdi-calendar', value: vehicle.value.year },
    { key: 'colour', label: 'Colour', icon: 'mdi-palette', value: vehicle.value.colour },
    { key: 'registration', label: 'Registration', icon: 'mdi-card-text', value: vehicle.value.registration_number },
    { key: 'vin', label: 'VIN #', icon: 'mdi-barcode', value: vehicle.value.vin_number },
    { 
      key: 'license', 
      label: 'License Disc Renewal', 
      icon: 'mdi-calendar-clock', 
      value: vehicle.value.license_disc_renewal ? formatDate(vehicle.value.license_disc_renewal) : null 
    },
    { 
      key: 'service', 
      label: 'Next Service Due', 
      icon: 'mdi-wrench', 
      value: vehicle.value.next_service_due_km ? `${formatNumber(vehicle.value.next_service_due_km)} km` : null 
    }
  ]
})

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const loadVehicle = async () => {
  loading.value = true
  try {
    vehicle.value = await $fetch<Vehicle>(`/api/vehicles/${vehicleId.value}`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    // Populate edit form
    if (vehicle.value) {
      editForm.make = vehicle.value.make
      editForm.model = vehicle.value.model
      editForm.year = vehicle.value.year
      editForm.colour = vehicle.value.colour
      editForm.registrationNumber = vehicle.value.registration_number
      editForm.vinNumber = vehicle.value.vin_number
      editForm.licenseDiscRenewal = vehicle.value.license_disc_renewal || ''
      editForm.nextServiceDueKm = vehicle.value.next_service_due_km
    }
  } catch (error) {
    console.error('Failed to load vehicle:', error)
    vehicle.value = null
  } finally {
    loading.value = false
  }
}

const loadServiceHistory = async () => {
  historyLoading.value = true
  try {
    serviceHistory.value = await $fetch<ServiceHistory[]>(`/api/vehicles/${vehicleId.value}/service-history`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
  } catch (error) {
    console.error('Failed to load service history:', error)
  } finally {
    historyLoading.value = false
  }
}

const submitEdit = async () => {
  if (!editForm.make || !editForm.model || !editForm.year || !editForm.registrationNumber) {
    editFeedback.value = 'Please fill in all required fields.'
    editFeedbackType.value = 'error'
    return
  }

  editLoading.value = true
  editFeedback.value = ''

  try {
    await $fetch(`/api/vehicles/${vehicleId.value}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: editForm
    })
    editFeedback.value = 'Vehicle updated successfully!'
    editFeedbackType.value = 'success'
    
    setTimeout(async () => {
      showEditDialog.value = false
      await loadVehicle()
      editFeedback.value = ''
    }, 1500)
  } catch (error) {
    editFeedback.value = 'Failed to update vehicle. Please try again.'
    editFeedbackType.value = 'error'
  } finally {
    editLoading.value = false
  }
}

const submitAddService = async () => {
  if (!newService.serviceDate || !newService.serviceType) {
    serviceFeedback.value = 'Please fill in service date and type.'
    serviceFeedbackType.value = 'error'
    return
  }

  serviceLoading.value = true
  serviceFeedback.value = ''

  try {
    await $fetch(`/api/vehicles/${vehicleId.value}/service-history`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: newService
    })
    serviceFeedback.value = 'Service record added successfully!'
    serviceFeedbackType.value = 'success'
    
    setTimeout(async () => {
      showAddServiceDialog.value = false
      await loadServiceHistory()
      // Reset form
      newService.serviceDate = new Date().toISOString().split('T')[0]
      newService.serviceType = ''
      newService.description = ''
      newService.odometerReading = null
      newService.cost = null
      newService.performedBy = ''
      newService.notes = ''
      serviceFeedback.value = ''
    }, 1500)
  } catch (error) {
    serviceFeedback.value = 'Failed to add service record. Please try again.'
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
  loadVehicle()
})
</script>

<style scoped>
.info-field {
  padding: 8px 0;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
