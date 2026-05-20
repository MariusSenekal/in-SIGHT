<template>
  <DashboardLayout>
    <!-- Quick action for creating QR codes -->
    <div v-if="isAdmin" class="d-flex justify-end mb-4">
      <v-btn color="success" variant="flat" prepend-icon="mdi-qrcode-plus" @click="openCreateRecord">
        Create QR Code
      </v-btn>
    </div>

    <!-- Main content card -->
    <v-card rounded="xl" elevation="2" class="pa-4 pa-md-6">

      <!-- ── Filters (admin only) ── -->
      <v-row v-if="isAdmin" dense class="mb-4">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="search"
            label="Search records"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filterOwnerUser"
            :items="userFilterItems"
            item-title="label"
            item-value="value"
            label="Filter by User"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filterOwnerCompany"
            :items="companyFilterItems"
            item-title="label"
            item-value="value"
            label="Filter by Company"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
      </v-row>

      <!-- ── Stats bar (admin) ── -->
      <v-row v-if="isAdmin" dense class="mb-5">
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="primary" variant="tonal" class="pa-3 text-center">
            <div class="text-h5 font-weight-bold">{{ allItems.length }}</div>
            <div class="text-caption">Total Items</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="warning" variant="tonal" class="pa-3 text-center">
            <div class="text-h5 font-weight-bold">{{ openRequestsCount }}</div>
            <div class="text-caption">Open Requests</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="success" variant="tonal" class="pa-3 text-center">
            <div class="text-h5 font-weight-bold">{{ filteredRecords.length }}</div>
            <div class="text-caption">Showing</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="lg" color="info" variant="tonal" class="pa-3 text-center">
            <div class="text-h5 font-weight-bold">{{ unassignedCount }}</div>
            <div class="text-caption">Unassigned</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- ── No results ── -->
      <v-alert v-if="filteredRecords.length === 0" type="info" variant="tonal" border="start">
        No records found{{ search || filterOwnerUser || filterOwnerCompany ? ' matching the current filters.' : '.' }}
      </v-alert>

      <!-- ── Record cards ── -->
      <v-row dense>
        <v-col cols="12" md="6" lg="4" v-for="record in filteredRecords" :key="`${record.type}-${record.id}`">
          <v-card rounded="lg" variant="outlined" class="h-100 d-flex flex-column">

            <!-- Card header -->
            <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-1 pb-1">
              <span class="text-truncate" style="max-width:180px">{{ record.name }}</span>
              <div class="d-flex ga-1">
                <v-chip size="x-small" color="primary" variant="flat">{{ record.code }}</v-chip>
                <v-chip 
                  size="x-small" 
                  :color="record.type === 'vehicle' ? 'blue' : record.type === 'equipment' ? 'orange' : 'grey'" 
                  variant="tonal"
                >
                  <v-icon v-if="record.type === 'vehicle'" icon="mdi-car" size="12" class="mr-1" />
                  <v-icon v-else-if="record.type === 'equipment'" icon="mdi-toolbox" size="12" class="mr-1" />
                  <v-icon v-else icon="mdi-qrcode" size="12" class="mr-1" />
                  {{ record.type === 'vehicle' ? 'Vehicle' : record.type === 'equipment' ? 'Equipment' : 'Record' }}
                </v-chip>
                <template v-if="isAdmin && record.type === 'record'">
                  <v-btn size="x-small" icon="mdi-pencil-outline" variant="text" color="primary" @click.stop="openEditRecordById(record.id)" />
                  <v-btn size="x-small" icon="mdi-delete-outline" variant="text" color="error" @click.stop="openDeleteRecordById(record.id)" />
                </template>
                <template v-else-if="!isAdmin && !isClientTechnician && record.type === 'record'">
                  <v-btn size="x-small" icon="mdi-pencil-outline" variant="text" color="primary" @click.stop="openEditRecordById(record.id)" />
                </template>
              </div>
            </v-card-title>

            <v-card-text class="flex-grow-1 pt-1">
              <!-- Type + location chips -->
              <div class="d-flex flex-wrap ga-1 mb-2">
                <v-chip v-if="record.subType" size="x-small" color="info" variant="tonal">{{ record.subType }}</v-chip>
                <v-chip v-if="record.location" size="x-small" color="secondary" variant="tonal" prepend-icon="mdi-map-marker">{{ record.location }}</v-chip>
              </div>

              <p v-if="record.description" class="text-body-2 text-medium-emphasis mb-2">{{ record.description }}</p>

              <!-- Owner info -->
              <div class="mb-2">
                <div v-if="ownerLabel(record)" class="d-flex align-center ga-1 text-body-2">
                  <v-icon size="14" icon="mdi-account-circle" class="text-medium-emphasis" />
                  <span>{{ ownerLabel(record) }}</span>
                </div>
                <div v-if="companyLabel(record)" class="d-flex align-center ga-1 text-body-2">
                  <v-icon size="14" icon="mdi-domain" class="text-medium-emphasis" />
                  <span>{{ companyLabel(record) }}</span>
                </div>
                <div v-if="!ownerLabel(record) && !companyLabel(record)" class="text-caption text-medium-emphasis">
                  Unassigned
                </div>
              </div>

              <!-- Requests summary for records only -->
              <div v-if="record.type === 'record'">
                <v-divider class="my-2" />
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-if="cleaningCount(record.code)"
                    size="x-small"
                    color="success"
                    variant="tonal"
                    prepend-icon="mdi-broom"
                  >{{ cleaningCount(record.code) }} cleaning</v-chip>
                  <v-chip
                    v-if="maintenanceCount(record.code)"
                    size="x-small"
                    color="error"
                    variant="tonal"
                    prepend-icon="mdi-wrench"
                  >{{ maintenanceCount(record.code) }} maintenance</v-chip>
                  <v-chip
                    v-if="satisfactionCount(record.code)"
                    size="x-small"
                    color="warning"
                    variant="tonal"
                    prepend-icon="mdi-emoticon"
                  >{{ satisfactionCount(record.code) }} feedback</v-chip>
                  <!-- Admin: clickable open-request chip navigates to requests filtered by this record -->
                  <v-chip
                    v-if="isAdmin && openRequestsForRecord(record.code)"
                    size="x-small"
                    color="orange"
                    variant="flat"
                    style="cursor:pointer"
                    append-icon="mdi-arrow-right"
                    @click="navigateTo(`/dashboard/requests?code=${record.code}`)"
                  >{{ openRequestsForRecord(record.code) }} open</v-chip>
                  <v-chip
                    v-else-if="!isAdmin && openRequestsForRecord(record.code)"
                    size="x-small"
                    color="orange"
                    variant="flat"
                  >{{ openRequestsForRecord(record.code) }} open</v-chip>
                  <span v-if="!cleaningCount(record.code) && !maintenanceCount(record.code) && !satisfactionCount(record.code)" class="text-caption text-medium-emphasis">No requests yet</span>
                </div>
              </div>
            </v-card-text>

            <v-card-actions class="pt-0">
              <!-- Records: QR scan page -->
              <template v-if="record.type === 'record'">
                <v-btn :to="`/scan/${record.code}`" size="small" color="primary" variant="tonal" prepend-icon="mdi-qrcode-scan" class="flex-grow-1">
                  View QR Page
                </v-btn>
                <v-btn
                  v-if="isAdmin"
                  :to="`/dashboard/requests?code=${record.code}`"
                  size="small"
                  color="warning"
                  variant="tonal"
                  prepend-icon="mdi-bell-outline"
                >Requests</v-btn>
              </template>
              
              <!-- Vehicles: tracking page -->
              <template v-else-if="record.type === 'vehicle'">
                <v-btn :to="`/modules/vehicles/${record.id}?from=records`" size="small" color="blue" variant="tonal" prepend-icon="mdi-car" class="flex-grow-1">
                  View Vehicle
                </v-btn>
              </template>
              
              <!-- Equipment: tracking page -->
              <template v-else-if="record.type === 'equipment'">
                <v-btn :to="`/modules/equipment/${record.id}?from=records`" size="small" color="orange" variant="tonal" prepend-icon="mdi-toolbox" class="flex-grow-1">
                  View Equipment
                </v-btn>
              </template>
            </v-card-actions>

          </v-card>
        </v-col>
      </v-row>

    </v-card>

    <!-- ── Create / Edit Record Dialog ── -->
  <v-dialog v-model="showRecordDialog" max-width="520" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon :icon="editingRecord ? 'mdi-qrcode-edit' : 'mdi-qrcode-plus'" />
        {{ editingRecord ? `Edit QR Code — ${editingRecord.code}` : 'Create QR Code' }}
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field v-model="recordForm.name" label="Name / Label" prepend-inner-icon="mdi-tag-outline" variant="outlined" density="comfortable" required />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="recordForm.type" label="Type" prepend-inner-icon="mdi-shape-outline" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="recordForm.location" label="Location / Room" prepend-inner-icon="mdi-map-marker-outline" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="recordForm.description" label="Description" prepend-inner-icon="mdi-text" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="recordForm.ownerUserId"
              :items="userAssignItems"
              item-title="label"
              item-value="value"
              label="Assign to User"
              variant="outlined"
              density="comfortable"
              clearable
              hint="Leave blank for company or admin"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="recordForm.ownerCompanyId"
              :items="companyAssignItems"
              item-title="label"
              item-value="value"
              label="Assign to Company"
              variant="outlined"
              density="comfortable"
              clearable
              hint="Leave blank for individual user"
              persistent-hint
            />
          </v-col>
        </v-row>
        <v-alert v-if="recordDialogError" type="error" variant="tonal" density="compact" class="mt-2">{{ recordDialogError }}</v-alert>
        <v-alert v-if="recordDialogSuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ recordDialogSuccess }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="recordDialogLoading" @click="showRecordDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :prepend-icon="editingRecord ? 'mdi-content-save' : 'mdi-plus'" :loading="recordDialogLoading" @click="submitRecordDialog">
          {{ editingRecord ? 'Save Changes' : 'Create QR Code' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Delete Record Confirm Dialog ── -->
  <v-dialog v-model="showDeleteDialog" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2 text-error">
        <v-icon icon="mdi-qrcode-remove" />
        Delete QR Code
      </v-card-title>
      <v-card-text>
        <p>Delete QR code <strong>{{ deleteTarget?.code }}</strong> (<em>{{ deleteTarget?.name }}</em>)?</p>
        <p class="text-medium-emphasis text-caption mt-2">All service entries, checklists and requests linked to this record will also be removed. This cannot be undone.</p>
        <v-alert v-if="deleteDialogError" type="error" variant="tonal" density="compact" class="mt-3">{{ deleteDialogError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="deleteDialogLoading" @click="showDeleteDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" prepend-icon="mdi-delete" :loading="deleteDialogLoading" @click="submitDelete">Delete Permanently</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </DashboardLayout>
</template>

<script setup lang="ts">
import type { Record as QrRecord } from '~/composables/useRecords'
import type { AppUser, Company } from '~/composables/useAuth'

const { isAdmin, isClientTechnician, initAuth, users, companies, loadUsers, loadCompanies, authToken } = useAuth()
const { records, loadRecords, addRecord, updateRecord, deleteRecord } = useRecords()
const { requests, loadRequests } = useServiceRequests()

// ── Load vehicles and equipment ───────────────────────────────────────────────
const vehicles = ref<any[]>([])
const equipment = ref<any[]>([])

const loadVehicles = async () => {
  if (!authToken.value) return
  try {
    const response = await $fetch<any[]>('/api/vehicles', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    vehicles.value = response || []
  } catch (error) {
    console.error('Failed to load vehicles:', error)
    vehicles.value = []
  }
}

const loadEquipment = async () => {
  if (!authToken.value) return
  try {
    const response = await $fetch<any[]>('/api/equipment', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    equipment.value = response || []
  } catch (error) {
    console.error('Failed to load equipment:', error)
    equipment.value = []
  }
}

// Unified item type
interface UnifiedItem {
  id: number
  code: string
  name: string
  type: 'record' | 'vehicle' | 'equipment'
  subType?: string  // For records: their type field
  location: string
  description: string
  ownerUserId: number | null
  ownerCompanyId: number | null
  // Vehicle-specific
  make?: string
  model?: string
  year?: number
  registrationNumber?: string
  // Equipment-specific
  category?: string
  serialNumber?: string
}

// Combine all items
const allItems = computed<UnifiedItem[]>(() => {
  const recordItems: UnifiedItem[] = records.value.map(r => ({
    id: r.id,
    code: r.code,
    name: r.name,
    type: 'record' as const,
    subType: r.type,
    location: r.location,
    description: r.description || '',
    ownerUserId: r.ownerUserId,
    ownerCompanyId: r.ownerCompanyId
  }))

  const vehicleItems: UnifiedItem[] = vehicles.value.map(v => ({
    id: v.id,
    code: v.code || 'NO-CODE',
    name: `${v.make} ${v.model} (${v.year})`,
    type: 'vehicle' as const,
    location: v.registration_number || '',
    description: `${v.colour} • VIN: ${v.vin_number || 'N/A'}`,
    ownerUserId: v.owner_user_id,
    ownerCompanyId: v.owner_company_id,
    make: v.make,
    model: v.model,
    year: v.year,
    registrationNumber: v.registration_number
  }))

  const equipmentItems: UnifiedItem[] = equipment.value.map(e => ({
    id: e.id,
    code: e.code || 'NO-CODE',
    name: e.name,
    type: 'equipment' as const,
    subType: e.category,
    location: e.location || '',
    description: `${e.category || 'Equipment'} • Serial: ${e.serial_number || 'N/A'}`,
    ownerUserId: e.owner_user_id,
    ownerCompanyId: e.owner_company_id,
    category: e.category,
    serialNumber: e.serial_number
  }))

  return [...recordItems, ...vehicleItems, ...equipmentItems]
})

// ── Filters ───────────────────────────────────────────────────────────────────
const search           = ref('')
const filterOwnerUser  = ref<number | null>(null)
const filterOwnerCompany = ref<number | null>(null)

const userFilterItems = computed(() => [
  ...users.value.map((u: AppUser) => ({ label: u.profile?.displayName || u.name, value: u.id }))
])

const companyFilterItems = computed(() => [
  ...companies.value.map((c: Company) => ({ label: c.name, value: c.id }))
])

const filteredRecords = computed(() => {
  let list = allItems.value
  if (filterOwnerUser.value !== null) {
    list = list.filter(item => item.ownerUserId === filterOwnerUser.value)
  }
  if (filterOwnerCompany.value !== null) {
    list = list.filter(item => item.ownerCompanyId === filterOwnerCompany.value)
  }
  if (search.value.trim()) {
    const term = search.value.trim().toLowerCase()
    list = list.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      (item.subType || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term)
    )
  }
  return list
})

// ── Owner helpers ─────────────────────────────────────────────────────────────
const ownerLabel = (item: UnifiedItem) => {
  if (!item.ownerUserId) return null
  const u = users.value.find((u: AppUser) => u.id === item.ownerUserId)
  return u ? (u.profile?.displayName || u.name) : `User #${item.ownerUserId}`
}

const companyLabel = (item: UnifiedItem) => {
  if (!item.ownerCompanyId) return null
  const c = companies.value.find((c: Company) => c.id === item.ownerCompanyId)
  return c ? c.name : `Company #${item.ownerCompanyId}`
}

// ── Request helpers ───────────────────────────────────────────────────────────
const requestsForCode = (code: string) =>
  requests.value.filter(r => r.recordCode?.toUpperCase() === code.toUpperCase())

const cleaningCount     = (code: string) => requestsForCode(code).filter(r => r.requestType === 'cleaning').length
const maintenanceCount  = (code: string) => requestsForCode(code).filter(r => r.requestType === 'maintenance').length
const satisfactionCount = (code: string) => requestsForCode(code).filter(r => r.requestType === 'satisfaction').length
const openRequestsForRecord = (code: string) => requestsForCode(code).filter(r => r.status === 'open').length

// ── Stats ──────────────────────────────────────────────────────────────────────
const openRequestsCount = computed(() =>
  requests.value.filter(r => r.status === 'open' && r.recordCode).length
)
const unassignedCount = computed(() =>
  allItems.value.filter(item => !item.ownerUserId && !item.ownerCompanyId).length
)

// ── Assign items for create/edit dialog ───────────────────────────────────────
const userAssignItems = computed(() => [
  { label: 'None', value: null },
  ...users.value.map((u: AppUser) => ({ label: u.profile?.displayName || u.name, value: u.id }))
])

const companyAssignItems = computed(() => [
  { label: 'None', value: null },
  ...companies.value.map((c: Company) => ({ label: c.name, value: c.id }))
])

// ── Create / Edit dialog ──────────────────────────────────────────────────────
const showRecordDialog   = ref(false)
const editingRecord      = ref<QrRecord | null>(null)
const recordDialogError  = ref('')
const recordDialogSuccess = ref('')
const recordDialogLoading = ref(false)

const recordForm = reactive({
  name: '',
  type: '',
  location: '',
  description: '',
  ownerUserId: null as number | null,
  ownerCompanyId: null as number | null
})

const openCreateRecord = () => {
  editingRecord.value       = null
  recordForm.name           = ''
  recordForm.type           = 'Cleaning Station'
  recordForm.location       = ''
  recordForm.description    = ''
  recordForm.ownerUserId    = null
  recordForm.ownerCompanyId = null
  recordDialogError.value   = ''
  recordDialogSuccess.value = ''
  showRecordDialog.value    = true
}

const openEditRecord = (record: QrRecord) => {
  editingRecord.value       = record
  recordForm.name           = record.name
  recordForm.type           = record.type
  recordForm.location       = record.location
  recordForm.description    = record.description
  recordForm.ownerUserId    = record.ownerUserId
  recordForm.ownerCompanyId = record.ownerCompanyId
  recordDialogError.value   = ''
  recordDialogSuccess.value = ''
  showRecordDialog.value    = true
}

const openEditRecordById = (id: number) => {
  const record = records.value.find(r => r.id === id)
  if (record) openEditRecord(record)
}

const submitRecordDialog = async () => {
  if (!recordForm.name.trim()) {
    recordDialogError.value = 'Name is required.'
    return
  }
  recordDialogError.value   = ''
  recordDialogSuccess.value = ''
  recordDialogLoading.value = true
  try {
    if (editingRecord.value) {
      await updateRecord(editingRecord.value.id, {
        name:          recordForm.name.trim(),
        type:          recordForm.type.trim(),
        location:      recordForm.location.trim(),
        description:   recordForm.description.trim(),
        ownerUserId:   recordForm.ownerUserId,
        ownerCompanyId: recordForm.ownerCompanyId
      })
      recordDialogSuccess.value = 'Record updated.'
    } else {
      const created = await addRecord({
        name:          recordForm.name.trim(),
        type:          recordForm.type.trim(),
        location:      recordForm.location.trim(),
        description:   recordForm.description.trim(),
        ownerUserId:   recordForm.ownerUserId,
        ownerCompanyId: recordForm.ownerCompanyId
      })
      recordDialogSuccess.value = `QR Code created: ${created.code}`
    }
    setTimeout(() => {
      showRecordDialog.value    = false
      recordDialogSuccess.value = ''
    }, 1200)
  } catch (err: unknown) {
    recordDialogError.value = (err as { data?: { message?: string } })?.data?.message ?? 'Operation failed.'
  } finally {
    recordDialogLoading.value = false
  }
}

// ── Delete dialog ─────────────────────────────────────────────────────────────
const showDeleteDialog  = ref(false)
const deleteTarget      = ref<QrRecord | null>(null)
const deleteDialogError = ref('')
const deleteDialogLoading = ref(false)

const openDeleteRecord = (record: QrRecord) => {
  deleteTarget.value      = record
  deleteDialogError.value = ''
  showDeleteDialog.value  = true
}
const openDeleteRecordById = (id: number) => {
  const record = records.value.find(r => r.id === id)
  if (record) openDeleteRecord(record)
}
const submitDelete = async () => {
  if (!deleteTarget.value) return
  deleteDialogError.value   = ''
  deleteDialogLoading.value = true
  try {
    await deleteRecord(deleteTarget.value.id)
    showDeleteDialog.value = false
    deleteTarget.value     = null
  } catch {
    deleteDialogError.value = 'Delete failed. Please try again.'
  } finally {
    deleteDialogLoading.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await initAuth()
  await Promise.all([
    loadRecords(),
    loadVehicles(),
    loadEquipment(),
    loadRequests(),
    ...(isAdmin.value ? [loadUsers(), loadCompanies()] : [])
  ])
})
</script>
