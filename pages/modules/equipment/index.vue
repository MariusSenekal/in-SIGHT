<template>
  <ModuleLayout
    title="Equipment Tracking"
    description="Manage your equipment and maintenance records"
    icon="mdi-toolbox"
  >
    <!-- Quick action for adding equipment -->
    <div class="d-flex justify-end mb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
        variant="flat"
      >
        Add Equipment
      </v-btn>
    </div>

    <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
        </div>

        <!-- Empty state -->
        <v-card v-else-if="equipment.length === 0" rounded="xl" elevation="2" class="pa-8 text-center">
          <v-icon icon="mdi-toolbox-outline" size="64" color="grey-lighten-1" class="mb-4" />
          <h3 class="text-h6 mb-2">No equipment yet</h3>
          <p class="text-medium-emphasis mb-4">Start tracking your equipment by adding your first item.</p>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddDialog = true">
            Add Your First Equipment
          </v-btn>
        </v-card>

        <!-- Equipment grid -->
        <v-row v-else dense>
          <v-col cols="12" sm="6" md="4" v-for="item in equipment" :key="item.id">
            <v-card
              rounded="xl"
              elevation="2"
              class="equipment-card cursor-pointer"
              @click="navigateTo(`/modules/equipment/${item.id}`)"
            >
              <div class="equipment-card__header">
                <v-icon icon="mdi-toolbox" size="32" color="primary" />
              </div>
              <v-card-text class="pa-4">
                <h3 class="text-h6 font-weight-bold mb-1">
                  {{ item.make }} {{ item.model || item.name }}
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-3">{{ item.year || item.category || 'Equipment' }}</p>
                
                <div class="d-flex flex-column ga-2">
                  <div v-if="item.code" class="d-flex align-center ga-2">
                    <v-icon icon="mdi-qrcode" size="16" color="grey" />
                    <span class="text-body-2 font-weight-medium">{{ item.code }}</span>
                  </div>
                  <div v-if="item.serial_number" class="d-flex align-center ga-2">
                    <v-icon icon="mdi-barcode" size="16" color="grey" />
                    <span class="text-body-2">{{ item.serial_number }}</span>
                  </div>
                  <div v-if="item.colour" class="d-flex align-center ga-2">
                    <v-icon icon="mdi-palette" size="16" color="grey" />
                    <span class="text-body-2">{{ item.colour }}</span>
                  </div>
                  <div v-if="item.unit_allocation" class="d-flex align-center ga-2">
                    <v-icon icon="mdi-office-building" size="16" color="grey" />
                    <span class="text-body-2">{{ item.unit_allocation }}</span>
                  </div>
                </div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn 
                  variant="text" 
                  color="primary" 
                  size="small"
                  @click.stop="navigateTo(`/modules/equipment/${item.id}`)"
                >
                  View Details
                </v-btn>
                <v-spacer />
                <v-btn 
                  variant="text" 
                  color="error" 
                  size="small"
                  icon="mdi-delete"
                  @click.stop="openDeleteDialog(item)"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

    <!-- Add Equipment Dialog -->
    <v-dialog v-model="showAddDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-toolbox-plus" color="primary" />
            Add New Equipment
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <v-form ref="addForm" @submit.prevent="submitAddEquipment">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newEquipment.make"
                  label="Make *"
                  prepend-inner-icon="mdi-tag"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newEquipment.model"
                  label="Model"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newEquipment.year"
                  label="Year"
                  type="number"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newEquipment.colour"
                  label="Colour"
                  prepend-inner-icon="mdi-palette"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newEquipment.serialNumber"
                  label="Serial Number"
                  prepend-inner-icon="mdi-barcode"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newEquipment.unitAllocation"
                  label="Unit Allocation"
                  prepend-inner-icon="mdi-office-building"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newEquipment.nextServiceDue"
                  label="Next Service Due"
                  type="date"
                  prepend-inner-icon="mdi-wrench-clock"
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
            @click="submitAddEquipment"
            :loading="addLoading"
          >
            Add Equipment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Equipment Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2 text-error">
            <v-icon icon="mdi-toolbox-outline" />
            Delete Equipment
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <p>Are you sure you want to delete <strong>{{ deleteTarget?.make }} {{ deleteTarget?.model || deleteTarget?.name }}</strong>?</p>
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
            @click="submitDeleteEquipment"
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

const { currentUser, authToken } = useAuth()

const loading = ref(true)
const equipment = ref<any[]>([])
const showAddDialog = ref(false)
const addLoading = ref(false)
const addFeedback = ref('')
const addFeedbackType = ref<'success' | 'error'>('success')

const showDeleteDialog = ref(false)
const deleteTarget = ref<any>(null)
const deleteLoading = ref(false)
const deleteFeedback = ref('')
const deleteFeedbackType = ref<'success' | 'error'>('success')

const newEquipment = reactive({
  make: '',
  model: '',
  year: null as number | null,
  colour: '',
  serialNumber: '',
  unitAllocation: '',
  nextServiceDue: ''
})

const loadEquipment = async () => {
  if (!authToken.value) return
  loading.value = true
  try {
    const response = await $fetch<any[]>('/api/equipment', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    equipment.value = response || []
  } catch (error) {
    console.error('Failed to load equipment:', error)
    equipment.value = []
  } finally {
    loading.value = false
  }
}

const submitAddEquipment = async () => {
  // Trim the make field
  const trimmedMake = newEquipment.make?.trim() || ''
  
  if (!trimmedMake) {
    addFeedback.value = 'Please enter equipment make (required)'
    addFeedbackType.value = 'error'
    return
  }

  addLoading.value = true
  addFeedback.value = ''

  try {
    await $fetch('/api/equipment', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        name: trimmedMake, // Include name field for API compatibility
        make: trimmedMake,
        model: newEquipment.model?.trim() || '',
        year: newEquipment.year || null,
        colour: newEquipment.colour?.trim() || '',
        serialNumber: newEquipment.serialNumber?.trim() || '',
        unitAllocation: newEquipment.unitAllocation?.trim() || '',
        nextServiceDue: newEquipment.nextServiceDue || null,
        category: '',
        location: '',
        status: 'active'
      }
    })

    addFeedback.value = 'Equipment added successfully!'
    addFeedbackType.value = 'success'

    // Reset form
    newEquipment.make = ''
    newEquipment.model = ''
    newEquipment.year = null
    newEquipment.colour = ''
    newEquipment.serialNumber = ''
    newEquipment.unitAllocation = ''
    newEquipment.nextServiceDue = ''

    // Reload equipment list
    await loadEquipment()

    // Close dialog after short delay
    setTimeout(() => {
      showAddDialog.value = false
      addFeedback.value = ''
    }, 1500)

  } catch (error: any) {
    console.error('Failed to add equipment:', error)
    addFeedback.value = error.data?.message || 'Failed to add equipment'
    addFeedbackType.value = 'error'
  } finally {
    addLoading.value = false
  }
}

const openDeleteDialog = (item: any) => {
  deleteTarget.value = item
  deleteFeedback.value = ''
  showDeleteDialog.value = true
}

const submitDeleteEquipment = async () => {
  if (!deleteTarget.value) return
  
  deleteLoading.value = true
  deleteFeedback.value = ''
  
  try {
    await $fetch(`/api/equipment/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    deleteFeedback.value = 'Equipment deleted successfully!'
    deleteFeedbackType.value = 'success'
    
    setTimeout(async () => {
      showDeleteDialog.value = false
      await loadEquipment()
      deleteTarget.value = null
      deleteFeedback.value = ''
    }, 1500)
  } catch (error) {
    deleteFeedback.value = 'Failed to delete equipment. Please try again.'
    deleteFeedbackType.value = 'error'
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  loadEquipment()
})
</script>

<style scoped>
.equipment-card {
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.equipment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.equipment-card__header {
  padding: 20px 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cursor-pointer {
  cursor: pointer;
}

.btn-gradient {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
</style>
