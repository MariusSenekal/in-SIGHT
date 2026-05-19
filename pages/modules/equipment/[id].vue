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
              @click="navigateTo('/modules/equipment')"
              class="mr-2"
            />
            <div>
              <h1 class="text-h4 font-weight-bold">Equipment Tracking</h1>
              <p class="text-h6 mb-1">{{ equipment.name }}</p>
              <p class="text-medium-emphasis mb-0">{{ equipment.category || 'Uncategorized' }} • {{ equipment.code }}</p>
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
                    color="secondary"
                    prepend-icon="mdi-qrcode"
                    @click="printQRCode"
                  >
                    Print QR Code
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
          <v-form @submit.prevent="submitEdit">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.name"
                  label="Equipment Name *"
                  prepend-inner-icon="mdi-tag"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.category"
                  label="Category"
                  prepend-inner-icon="mdi-shape"
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
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.location"
                  label="Location"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editForm.status"
                  :items="statusOptions"
                  label="Status"
                  prepend-inner-icon="mdi-circle"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.purchaseDate"
                  label="Purchase Date"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editForm.notes"
                  label="Notes"
                  prepend-inner-icon="mdi-note-text"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
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
            Update
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
const equipmentId = computed(() => route.params.id as string)

interface Equipment {
  id: number
  name: string
  category: string
  code: string
  serial_number: string
  location: string
  status: string
  purchase_date: string | null
  notes: string
  owner_user_id: number | null
  owner_company_id: number | null
}

const equipment = ref<Equipment | null>(null)
const loading = ref(true)
const showEditDialog = ref(false)
const editLoading = ref(false)
const editFeedback = ref('')
const editFeedbackType = ref<'success' | 'error'>('success')

const statusOptions = [
  'Active',
  'In Service',
  'Maintenance',
  'Out of Service',
  'Retired'
]

const editForm = reactive({
  name: '',
  category: '',
  serialNumber: '',
  location: '',
  status: 'Active',
  purchaseDate: '',
  notes: ''
})

const equipmentFields = computed(() => {
  if (!equipment.value) return []
  return [
    { key: 'name', label: 'Equipment Name', icon: 'mdi-tag', value: equipment.value.name },
    { key: 'category', label: 'Category', icon: 'mdi-shape', value: equipment.value.category },
    { key: 'code', label: 'QR Code', icon: 'mdi-qrcode', value: equipment.value.code },
    { key: 'serial', label: 'Serial Number', icon: 'mdi-barcode', value: equipment.value.serial_number },
    { key: 'location', label: 'Location', icon: 'mdi-map-marker', value: equipment.value.location },
    { key: 'status', label: 'Status', icon: 'mdi-circle', value: equipment.value.status || 'Active' },
    { 
      key: 'purchase', 
      label: 'Purchase Date', 
      icon: 'mdi-calendar', 
      value: equipment.value.purchase_date ? formatDate(equipment.value.purchase_date) : null 
    },
    { key: 'notes', label: 'Notes', icon: 'mdi-note-text', value: equipment.value.notes }
  ]
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const loadEquipment = async () => {
  loading.value = true
  try {
    equipment.value = await $fetch<Equipment>(`/api/equipment/${equipmentId.value}`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    // Populate edit form
    if (equipment.value) {
      editForm.name = equipment.value.name
      editForm.category = equipment.value.category || ''
      editForm.serialNumber = equipment.value.serial_number || ''
      editForm.location = equipment.value.location || ''
      editForm.status = equipment.value.status || 'Active'
      editForm.purchaseDate = equipment.value.purchase_date || ''
      editForm.notes = equipment.value.notes || ''
    }
  } catch (error) {
    console.error('Failed to load equipment:', error)
    equipment.value = null
  } finally {
    loading.value = false
  }
}

const submitEdit = async () => {
  if (!editForm.name) {
    editFeedback.value = 'Please fill in the equipment name.'
    editFeedbackType.value = 'error'
    return
  }

  editLoading.value = true
  editFeedback.value = ''

  try {
    await $fetch(`/api/equipment/${equipmentId.value}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        name: editForm.name,
        category: editForm.category,
        serialNumber: editForm.serialNumber,
        location: editForm.location,
        status: editForm.status,
        purchaseDate: editForm.purchaseDate || null,
        notes: editForm.notes
      }
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

const printQRCode = () => {
  navigateTo('/dashboard/qr-codes')
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
