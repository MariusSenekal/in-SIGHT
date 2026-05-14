<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="10" xl="9">
        
        <!-- Page header -->
        <div class="d-flex align-center justify-space-between mb-5">
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="navigateTo('/modules')"
              class="mr-2"
            />
            <div>
              <h1 class="text-h4 font-weight-bold">Vehicle Tracking</h1>
              <p class="text-medium-emphasis mb-0">Manage your fleet and service records</p>
            </div>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="showAddDialog = true"
            class="btn-gradient"
          >
            Add Vehicle
          </v-btn>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
        </div>

        <!-- Empty state -->
        <v-card v-else-if="vehicles.length === 0" rounded="xl" elevation="2" class="pa-8 text-center">
          <v-icon icon="mdi-car-off" size="64" color="grey-lighten-1" class="mb-4" />
          <h3 class="text-h6 mb-2">No vehicles yet</h3>
          <p class="text-medium-emphasis mb-4">Start tracking your vehicles by adding your first one.</p>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddDialog = true">
            Add Your First Vehicle
          </v-btn>
        </v-card>

        <!-- Vehicles grid -->
        <v-row v-else dense>
          <v-col cols="12" sm="6" md="4" v-for="vehicle in vehicles" :key="vehicle.id">
            <v-card
              rounded="xl"
              elevation="2"
              class="vehicle-card cursor-pointer"
              @click="navigateTo(`/modules/vehicles/${vehicle.id}`)"
            >
              <div class="vehicle-card__header">
                <v-icon icon="mdi-car" size="32" color="primary" />
              </div>
              <v-card-text class="pa-4">
                <h3 class="text-h6 font-weight-bold mb-1">
                  {{ vehicle.make }} {{ vehicle.model }}
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-3">{{ vehicle.year }}</p>
                
                <div class="d-flex flex-column ga-2">
                  <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-card-text" size="16" color="grey" />
                    <span class="text-body-2">{{ vehicle.registration_number }}</span>
                  </div>
                  <div v-if="vehicle.colour" class="d-flex align-center ga-2">
                    <v-icon icon="mdi-palette" size="16" color="grey" />
                    <span class="text-body-2">{{ vehicle.colour }}</span>
                  </div>
                  <div v-if="vehicle.next_service_due_km" class="d-flex align-center ga-2">
                    <v-icon icon="mdi-wrench" size="16" color="grey" />
                    <span class="text-body-2">Service at {{ formatNumber(vehicle.next_service_due_km) }} km</span>
                  </div>
                </div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn 
                  variant="text" 
                  color="primary" 
                  size="small"
                  @click.stop="navigateTo(`/modules/vehicles/${vehicle.id}`)"
                >
                  View Details
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

      </v-col>
    </v-row>

    <!-- Add Vehicle Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-car-plus" color="primary" />
            Add New Vehicle
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <v-form ref="addForm" @submit.prevent="submitAddVehicle">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newVehicle.make"
                  label="Make *"
                  prepend-inner-icon="mdi-car"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newVehicle.model"
                  label="Model *"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newVehicle.year"
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
                  v-model="newVehicle.colour"
                  label="Colour"
                  prepend-inner-icon="mdi-palette"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newVehicle.registrationNumber"
                  label="Registration Number *"
                  prepend-inner-icon="mdi-card-text"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newVehicle.vinNumber"
                  label="VIN #"
                  prepend-inner-icon="mdi-barcode"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newVehicle.licenseDiscRenewal"
                  label="License Disc Renewal"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newVehicle.nextServiceDueKm"
                  label="Next Service Due (km)"
                  type="number"
                  prepend-inner-icon="mdi-wrench"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <v-alert v-if="addFeedback" :type="addFeedbackType" variant="tonal" density="compact" class="mt-3">
              {{ addFeedback }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            prepend-icon="mdi-check" 
            @click="submitAddVehicle"
            :loading="addLoading"
          >
            Add Vehicle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const { authToken } = useAuth()

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

const vehicles = ref<Vehicle[]>([])
const loading = ref(true)
const showAddDialog = ref(false)
const addLoading = ref(false)
const addFeedback = ref('')
const addFeedbackType = ref<'success' | 'error'>('success')

const newVehicle = reactive({
  make: '',
  model: '',
  year: new Date().getFullYear(),
  colour: '',
  registrationNumber: '',
  vinNumber: '',
  licenseDiscRenewal: '',
  nextServiceDueKm: null as number | null
})

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const loadVehicles = async () => {
  loading.value = true
  try {
    vehicles.value = await $fetch<Vehicle[]>('/api/vehicles', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
  } catch (error) {
    console.error('Failed to load vehicles:', error)
  } finally {
    loading.value = false
  }
}

const submitAddVehicle = async () => {
  if (!newVehicle.make || !newVehicle.model || !newVehicle.year || !newVehicle.registrationNumber) {
    addFeedback.value = 'Please fill in all required fields.'
    addFeedbackType.value = 'error'
    return
  }

  addLoading.value = true
  addFeedback.value = ''

  try {
    await $fetch('/api/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: newVehicle
    })
    addFeedback.value = 'Vehicle added successfully!'
    addFeedbackType.value = 'success'
    
    setTimeout(async () => {
      showAddDialog.value = false
      await loadVehicles()
      // Reset form
      newVehicle.make = ''
      newVehicle.model = ''
      newVehicle.year = new Date().getFullYear()
      newVehicle.colour = ''
      newVehicle.registrationNumber = ''
      newVehicle.vinNumber = ''
      newVehicle.licenseDiscRenewal = ''
      newVehicle.nextServiceDueKm = null
      addFeedback.value = ''
    }, 1500)
  } catch (error) {
    addFeedback.value = 'Failed to add vehicle. Please try again.'
    addFeedbackType.value = 'error'
  } finally {
    addLoading.value = false
  }
}

onMounted(() => {
  loadVehicles()
})
</script>

<style scoped>
.vehicle-card {
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.vehicle-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.vehicle-card__header {
  padding: 20px 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cursor-pointer {
  cursor: pointer;
}

.btn-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
}
</style>
