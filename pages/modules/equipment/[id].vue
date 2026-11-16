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
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="editFormEl" @submit.prevent="submitEdit">
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
                <DatePickerField
                  v-model="editForm.nextServiceDue"
                  label="Next Service Due"
                  prepend-inner-icon="mdi-wrench-clock"
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
      module="equipment"
      :record-id="equipmentId"
    />
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const route = useRoute()
const { isAuthenticated, isAdmin } = useAuth()
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
  description: string
}

const equipment = ref<Equipment | null>(null)
const loading = ref(true)
const showEditDialog = ref(false)
const showServiceHistory = ref(false)
const editLoading = ref(false)
const editFeedback = ref('')
const editFeedbackType = ref<'success' | 'error'>('success')

const editForm = reactive({
  make: '',
  model: '',
  year: null as number | null,
  colour: '',
  serialNumber: '',
  unitAllocation: '',
  nextServiceDue: ''
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

onMounted(() => {
  loadEquipment()
})
</script>

<style scoped>
.info-field {
  padding: 8px 0;
}
</style>
