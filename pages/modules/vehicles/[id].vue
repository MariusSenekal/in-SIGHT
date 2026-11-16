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
              @click="handleBack"
              class="mr-2"
            />
            <div>
              <h1 class="text-h4 font-weight-bold">Vehicle Tracking</h1>
              <p class="text-h6 mb-1">{{ vehicle.make }} {{ vehicle.model }}</p>
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
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="editFormEl" @submit.prevent="submitEdit">
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
                <DatePickerField
                  v-model="editForm.licenseDiscRenewal"
                  label="License Disc Renewal"
                  prepend-inner-icon="mdi-calendar-clock"
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
    <ServiceHistoryDialog
      v-model="showServiceHistory"
      module="vehicles"
      :record-id="vehicleId"
    />
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const route = useRoute()
const { isAuthenticated, isAdmin } = useAuth()
const vehicleId = computed(() => route.params.id as string)

interface Vehicle {
  id: number
  code: string
  make: string
  model: string
  year: number
  colour: string
  registration_number: string
  vin_number: string
  license_disc_renewal: string | null
  next_service_due_km: number | null
}

const vehicle = ref<Vehicle | null>(null)
const loading = ref(true)
const showEditDialog = ref(false)
const showServiceHistory = ref(false)
const editLoading = ref(false)
const editFeedback = ref('')
const editFeedbackType = ref<'success' | 'error'>('success')

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

const vehicleFields = computed(() => {
  if (!vehicle.value) return []
  return [
    { key: 'code', label: 'QR Code', icon: 'mdi-qrcode', value: vehicle.value.code },
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
  // Otherwise go to vehicles list
  navigateTo('/modules/vehicles')
}

const loadVehicle = async () => {
  loading.value = true
  try {
    vehicle.value = await $fetch<Vehicle>(`/api/vehicles/${vehicleId.value}`, {
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

onMounted(() => {
  loadVehicle()
})
</script>

<style scoped>
.info-field {
  padding: 8px 0;
}
</style>
