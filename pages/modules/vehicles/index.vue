<template>
  <ModuleLayout
    title="Vehicle Tracking"
    description="Manage your fleet and service records"
    icon="mdi-car"
  >
    <!-- Quick action for adding vehicles -->
    <div class="d-flex justify-end mb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
        variant="flat"
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
                  <div v-if="vehicle.code" class="d-flex align-center ga-2">
                    <v-icon icon="mdi-qrcode" size="16" color="grey" />
                    <span class="text-body-2 font-weight-medium">{{ vehicle.code }}</span>
                  </div>
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
                <v-spacer />
                <v-btn 
                  variant="text" 
                  color="primary" 
                  size="small"
                  icon="mdi-pencil"
                  @click.stop="openEditDialog(vehicle)"
                />
                <v-btn 
                  variant="text" 
                  color="error" 
                  size="small"
                  icon="mdi-delete"
                  @click.stop="openDeleteDialog(vehicle)"
                />
              </v-card-actions>
            </v-card>
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

    <!-- Edit Vehicle Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-pencil" color="primary" />
            Edit Vehicle
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <v-form ref="editFormRef" @submit.prevent="submitEditVehicle">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editVehicle.make"
                  label="Make *"
                  prepend-inner-icon="mdi-car"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editVehicle.model"
                  label="Model *"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editVehicle.year"
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
                  v-model="editVehicle.colour"
                  label="Colour"
                  prepend-inner-icon="mdi-palette"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editVehicle.registrationNumber"
                  label="Registration Number *"
                  prepend-inner-icon="mdi-card-text"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editVehicle.vinNumber"
                  label="VIN #"
                  prepend-inner-icon="mdi-barcode"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editVehicle.licenseDiscRenewal"
                  label="License Disc Renewal"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editVehicle.nextServiceDueKm"
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
            @click="submitEditVehicle"
            :loading="editLoading"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Vehicle Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2 text-error">
            <v-icon icon="mdi-car-off" />
            Delete Vehicle
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <p>Are you sure you want to delete <strong>{{ deleteTarget?.make }} {{ deleteTarget?.model }}</strong>?</p>
          <p class="text-medium-emphasis text-caption mt-2">This action cannot be undone.</p>
          <v-alert v-if="deleteFeedback" :type="deleteFeedbackType" variant="tonal" density="compact" class="mt-3">
            {{ deleteFeedback }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="deleteLoading"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteLoading"
            @click="submitDeleteVehicle"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </ModuleLayout>
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

const showEditDialog = ref(false)
const editTarget = ref<Vehicle | null>(null)
const editLoading = ref(false)
const editFeedback = ref('')
const editFeedbackType = ref<'success' | 'error'>('success')

const editVehicle = reactive({
  make: '',
  model: '',
  year: new Date().getFullYear(),
  colour: '',
  registrationNumber: '',
  vinNumber: '',
  licenseDiscRenewal: '',
  nextServiceDueKm: null as number | null
})

const showDeleteDialog = ref(false)
const deleteTarget = ref<Vehicle | null>(null)
const deleteLoading = ref(false)
const deleteFeedback = ref('')
const deleteFeedbackType = ref<'success' | 'error'>('success')

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

const openEditDialog = (vehicle: Vehicle) => {
  editTarget.value = vehicle
  editVehicle.make = vehicle.make
  editVehicle.model = vehicle.model
  editVehicle.year = vehicle.year
  editVehicle.colour = vehicle.colour
  editVehicle.registrationNumber = vehicle.registration_number
  editVehicle.vinNumber = vehicle.vin_number
  editVehicle.licenseDiscRenewal = vehicle.license_disc_renewal || ''
  editVehicle.nextServiceDueKm = vehicle.next_service_due_km
  editFeedback.value = ''
  showEditDialog.value = true
}

const submitEditVehicle = async () => {
  if (!editVehicle.make || !editVehicle.model || !editVehicle.year || !editVehicle.registrationNumber) {
    editFeedback.value = 'Please fill in all required fields.'
    editFeedbackType.value = 'error'
    return
  }

  editLoading.value = true
  editFeedback.value = ''

  try {
    await $fetch(`/api/vehicles/${editTarget.value!.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: editVehicle
    })
    editFeedback.value = 'Vehicle updated successfully!'
    editFeedbackType.value = 'success'

    setTimeout(async () => {
      showEditDialog.value = false
      await loadVehicles()
      editFeedback.value = ''
    }, 1500)
  } catch (error) {
    editFeedback.value = 'Failed to update vehicle. Please try again.'
    editFeedbackType.value = 'error'
  } finally {
    editLoading.value = false
  }
}

const openDeleteDialog = (vehicle: Vehicle) => {
  deleteTarget.value = vehicle
  deleteFeedback.value = ''
  showDeleteDialog.value = true
}

const submitDeleteVehicle = async () => {
  if (!deleteTarget.value) return
  
  deleteLoading.value = true
  deleteFeedback.value = ''
  
  try {
    await $fetch(`/api/vehicles/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    deleteFeedback.value = 'Vehicle deleted successfully!'
    deleteFeedbackType.value = 'success'
    
    setTimeout(async () => {
      showDeleteDialog.value = false
      await loadVehicles()
      deleteTarget.value = null
      deleteFeedback.value = ''
    }, 1500)
  } catch (error: any) {
    console.error('Delete vehicle error:', error)
    deleteFeedback.value = error?.data?.message || error?.message || 'Failed to delete vehicle. Please try again.'
    deleteFeedbackType.value = 'error'
  } finally {
    deleteLoading.value = false
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
