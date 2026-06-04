<template>
  <ModuleLayout
    title="Client Management"
    description="Manage client information and relationships"
    icon="mdi-account-tie"
  >
    <!-- Actions bar -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search clients..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 320px;"
      />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="flat"
        @click="openAddClientDialog"
      >
        Add Client
      </v-btn>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error state -->
    <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4" rounded="xl">
      {{ loadError }}
    </v-alert>

    <!-- Empty state -->
    <v-card v-else-if="filteredClients.length === 0" rounded="xl" elevation="2" class="pa-8 text-center">
      <v-icon icon="mdi-account-off" size="64" color="grey-lighten-1" class="mb-4" />
      <h3 class="text-h6 mb-2">{{ search ? 'No clients found' : 'No clients yet' }}</h3>
      <p class="text-medium-emphasis mb-4">
        {{ search ? 'Try a different search term.' : 'Start by adding your first client.' }}
      </p>
      <v-btn v-if="!search" color="primary" prepend-icon="mdi-plus" @click="openAddClientDialog">
        Add Your First Client
      </v-btn>
    </v-card>

    <!-- Client cards grid -->
    <v-row v-else dense>
      <v-col cols="12" sm="6" lg="4" v-for="client in filteredClients" :key="client.id">
        <v-card rounded="xl" elevation="2" class="client-card">
          <div class="client-card__strip" />
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between ga-2 mb-3">
              <div>
                <h3 class="text-h6 font-weight-bold">{{ client.company_name }}</h3>
                <p class="text-body-2 text-medium-emphasis" v-if="client.name || client.surname">
                  {{ [client.name, client.surname].filter(Boolean).join(' ') }}
                </p>
              </div>
              <v-chip
                :color="statusColor(client.status)"
                size="small"
                variant="tonal"
                class="flex-shrink-0"
              >
                {{ client.status }}
              </v-chip>
            </div>

            <div class="d-flex flex-column ga-1">
              <div v-if="client.industry" class="d-flex align-center ga-2">
                <v-icon icon="mdi-domain" size="15" color="grey" />
                <span class="text-body-2">{{ client.industry }}</span>
              </div>
              <div v-if="client.service_type" class="d-flex align-center ga-2">
                <v-icon icon="mdi-spray-bottle" size="15" color="grey" />
                <span class="text-body-2">{{ client.service_type }}</span>
              </div>
              <div v-if="client.mobile_number" class="d-flex align-center ga-2">
                <v-icon icon="mdi-phone" size="15" color="grey" />
                <span class="text-body-2">{{ client.mobile_number }}</span>
              </div>
              <div v-if="client.next_service_due" class="d-flex align-center ga-2">
                <v-icon icon="mdi-calendar-clock" size="15" :color="isOverdue(client.next_service_due) ? 'error' : 'grey'" />
                <span class="text-body-2" :class="isOverdue(client.next_service_due) ? 'text-error' : ''">
                  Next service: {{ formatDate(client.next_service_due) }}
                </span>
              </div>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-history"
              @click="openServiceHistoryDialog(client)"
            >
              Service History
            </v-btn>
            <v-spacer />
            <v-btn
              v-if="isAdmin"
              variant="text"
              color="secondary"
              size="small"
              icon="mdi-pencil"
              @click="openEditClientDialog(client)"
            />
            <v-btn
              v-if="isAdmin"
              variant="text"
              color="error"
              size="small"
              icon="mdi-delete"
              @click="openDeleteClientDialog(client)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── Add / Edit Client Dialog ─── -->
    <v-dialog v-model="showClientDialog" max-width="760" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon :icon="editingClient ? 'mdi-pencil' : 'mdi-account-plus'" color="primary" />
            {{ editingClient ? 'Edit Client' : 'Add New Client' }}
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="clientFormEl">
            <!-- Company info -->
            <p class="text-overline text-medium-emphasis mb-2">Company Information</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.companyName"
                  label="Company Name *"
                  prepend-inner-icon="mdi-domain"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.companyRegistration"
                  label="Company Registration"
                  prepend-inner-icon="mdi-file-document"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.industry"
                  label="Industry"
                  prepend-inner-icon="mdi-briefcase"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.relationshipAllocation"
                  label="Relationship Allocation"
                  prepend-inner-icon="mdi-account-supervisor"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.annualRevenue"
                  label="Annual Revenue"
                  type="number"
                  prepend-inner-icon="mdi-currency-usd"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="clientForm.status"
                  label="Status"
                  :items="statusOptions"
                  prepend-inner-icon="mdi-circle"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="clientForm.address"
                  label="Address"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Contact info -->
            <p class="text-overline text-medium-emphasis mt-3 mb-2">Contact Person</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.name"
                  label="Name"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.surname"
                  label="Surname"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.email"
                  label="Email"
                  type="email"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.mobileNumber"
                  label="Mobile Number"
                  prepend-inner-icon="mdi-cellphone"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.landlineNumber"
                  label="Landline Number"
                  prepend-inner-icon="mdi-phone-classic"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Service info -->
            <p class="text-overline text-medium-emphasis mt-3 mb-2">Service Details</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.serviceType"
                  label="Service Type"
                  prepend-inner-icon="mdi-spray-bottle"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.lastServiced"
                  label="Last Serviced"
                  type="date"
                  prepend-inner-icon="mdi-calendar-check"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.nextServiceDue"
                  label="Next Service Due"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="clientForm.contractRenewalDate"
                  label="Contract Renewal Date"
                  type="date"
                  prepend-inner-icon="mdi-file-sign"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="clientForm.specialRequirements"
                  label="Special Requirements"
                  prepend-inner-icon="mdi-star-outline"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="clientForm.regFlagsNotes"
                  label="Red Flags / Notes"
                  prepend-inner-icon="mdi-flag"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                />
              </v-col>
            </v-row>
          </v-form>
          <v-alert v-if="clientFeedback" :type="clientFeedbackType" variant="tonal" density="compact" class="mt-3">
            {{ clientFeedback }}
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-5 py-4">
          <v-spacer />
          <v-btn variant="text" @click="showClientDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="editingClient ? 'mdi-content-save' : 'mdi-check'"
            :loading="clientLoading"
            @click="submitClientForm"
          >
            {{ editingClient ? 'Save Changes' : 'Add Client' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Delete Client Dialog ─── -->
    <v-dialog v-model="showDeleteClientDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2 text-error">
            <v-icon icon="mdi-account-remove" />
            Delete Client
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <p>Are you sure you want to delete <strong>{{ deleteClientTarget?.company_name }}</strong>?</p>
          <p class="text-medium-emphasis text-caption mt-2">This will also delete all service history. This action cannot be undone.</p>
          <v-alert v-if="deleteClientFeedback" :type="deleteClientFeedbackType" variant="tonal" density="compact" class="mt-3">
            {{ deleteClientFeedback }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" :disabled="deleteClientLoading" @click="showDeleteClientDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteClientLoading" @click="submitDeleteClient">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Service History Dialog ─── -->
    <v-dialog v-model="showServiceHistoryDialog" max-width="700" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center justify-space-between ga-2 flex-wrap">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-history" color="primary" />
              <span>Service History — {{ serviceHistoryClient?.company_name }}</span>
            </div>
            <v-btn
              v-if="isAdmin"
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              variant="tonal"
              @click="openAddServiceHistoryDialog"
            >
              Add Service
            </v-btn>
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div v-if="serviceHistoryLoading" class="text-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-alert v-else-if="serviceHistory.length === 0" type="info" variant="tonal" density="compact">
            No service history recorded yet.
          </v-alert>

          <v-list v-else lines="two" class="pa-0">
            <v-list-item
              v-for="entry in serviceHistory"
              :key="entry.id"
              rounded="lg"
              class="mb-2 border"
            >
              <template #prepend>
                <v-icon
                  :icon="entry.service_completed ? 'mdi-check-circle' : 'mdi-clock-outline'"
                  :color="entry.service_completed ? 'success' : 'warning'"
                  size="28"
                />
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ formatDate(entry.service_date) }} at {{ formatTime(entry.service_time) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <span v-if="entry.staff_on_site">Staff: {{ entry.staff_on_site }}</span>
                <span v-if="entry.staff_on_site && entry.additional_info"> · </span>
                <span v-if="entry.additional_info">{{ entry.additional_info }}</span>
              </v-list-item-subtitle>
              <template #append>
                <div class="d-flex ga-1">
                  <v-btn
                    v-if="isAdmin"
                    icon="mdi-pencil"
                    size="x-small"
                    variant="text"
                    color="secondary"
                    @click="openEditServiceHistoryDialog(entry)"
                  />
                  <v-btn
                    v-if="isAdmin"
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="openDeleteServiceHistoryDialog(entry)"
                  />
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-5 py-4">
          <v-spacer />
          <v-btn variant="text" @click="showServiceHistoryDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Add / Edit Service History Dialog ─── -->
    <v-dialog v-model="showServiceEntryDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon :icon="editingServiceEntry ? 'mdi-pencil' : 'mdi-calendar-plus'" color="primary" />
            {{ editingServiceEntry ? 'Edit Service Entry' : 'Add Service History' }}
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="serviceEntryForm">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="serviceEntryForm.serviceDate"
                  label="Service Date *"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="serviceEntryForm.serviceTime"
                  label="Service Time *"
                  type="time"
                  prepend-inner-icon="mdi-clock-outline"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Required']"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="serviceEntryForm.serviceCompleted"
                  label="Service Completed"
                  color="success"
                  hide-details
                  density="comfortable"
                  inset
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="serviceEntryForm.staffOnSite"
                  label="Staff on Site"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="serviceEntryForm.additionalInfo"
                  label="Additional Information (optional)"
                  prepend-inner-icon="mdi-text"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  auto-grow
                />
              </v-col>
            </v-row>
          </v-form>
          <v-alert v-if="serviceEntryFeedback" :type="serviceEntryFeedbackType" variant="tonal" density="compact" class="mt-2">
            {{ serviceEntryFeedback }}
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-5 py-4">
          <v-spacer />
          <v-btn variant="text" @click="showServiceEntryDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="editingServiceEntry ? 'mdi-content-save' : 'mdi-check'"
            :loading="serviceEntryLoading"
            @click="submitServiceEntryForm"
          >
            {{ editingServiceEntry ? 'Save Changes' : 'Add Entry' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Delete Service History Entry Dialog ─── -->
    <v-dialog v-model="showDeleteServiceEntryDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2 text-error">
            <v-icon icon="mdi-delete" />
            Delete Service Entry
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <p>Delete service entry for <strong>{{ deleteServiceEntryTarget ? formatDate(deleteServiceEntryTarget.service_date) : '' }}</strong>?</p>
          <p class="text-medium-emphasis text-caption mt-2">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" :disabled="deleteServiceEntryLoading" @click="showDeleteServiceEntryDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteServiceEntryLoading" @click="submitDeleteServiceEntry">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </ModuleLayout>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const { authToken, isAdmin, initAuth } = useAuth()
initAuth()

// ─── Types ───────────────────────────────────────────────────────────────────
interface Client {
  id: number
  company_name: string
  name: string
  surname: string
  address: string
  email: string
  industry: string
  relationship_allocation: string
  annual_revenue: number | null
  special_requirements: string
  last_serviced: string | null
  company_registration: string
  landline_number: string
  mobile_number: string
  status: string
  service_type: string
  contract_renewal_date: string | null
  reg_flags_notes: string
  next_service_due: string | null
}

interface ServiceHistoryEntry {
  id: number
  client_id: number
  service_date: string
  service_time: string
  service_completed: boolean
  staff_on_site: string
  additional_info: string
}

// ─── State ───────────────────────────────────────────────────────────────────
const clients = ref<Client[]>([])
const loading = ref(true)
const search = ref('')

const statusOptions = ['active', 'inactive', 'prospect', 'suspended']

const filteredClients = computed(() => {
  if (!search.value) return clients.value
  const q = search.value.toLowerCase()
  return clients.value.filter(c =>
    c.company_name.toLowerCase().includes(q) ||
    c.name?.toLowerCase().includes(q) ||
    c.surname?.toLowerCase().includes(q) ||
    c.industry?.toLowerCase().includes(q) ||
    c.service_type?.toLowerCase().includes(q)
  )
})

// ─── Client form state ───────────────────────────────────────────────────────
const showClientDialog = ref(false)
const editingClient = ref<Client | null>(null)
const clientLoading = ref(false)
const clientFeedback = ref('')
const clientFeedbackType = ref<'success' | 'error'>('success')

const defaultClientForm = () => ({
  companyName: '',
  companyRegistration: '',
  industry: '',
  relationshipAllocation: '',
  annualRevenue: null as number | null,
  status: 'active',
  address: '',
  name: '',
  surname: '',
  email: '',
  mobileNumber: '',
  landlineNumber: '',
  serviceType: '',
  lastServiced: '',
  nextServiceDue: '',
  contractRenewalDate: '',
  specialRequirements: '',
  regFlagsNotes: ''
})

const clientForm = reactive(defaultClientForm())

// ─── Delete client state ─────────────────────────────────────────────────────
const showDeleteClientDialog = ref(false)
const deleteClientTarget = ref<Client | null>(null)
const deleteClientLoading = ref(false)
const deleteClientFeedback = ref('')
const deleteClientFeedbackType = ref<'success' | 'error'>('success')

// ─── Service history state ───────────────────────────────────────────────────
const showServiceHistoryDialog = ref(false)
const serviceHistoryClient = ref<Client | null>(null)
const serviceHistory = ref<ServiceHistoryEntry[]>([])
const serviceHistoryLoading = ref(false)

// ─── Service entry form state ─────────────────────────────────────────────────
const showServiceEntryDialog = ref(false)
const editingServiceEntry = ref<ServiceHistoryEntry | null>(null)
const serviceEntryLoading = ref(false)
const serviceEntryFeedback = ref('')
const serviceEntryFeedbackType = ref<'success' | 'error'>('success')

const defaultServiceEntryForm = () => ({
  serviceDate: '',
  serviceTime: '',
  serviceCompleted: false,
  staffOnSite: '',
  additionalInfo: ''
})

const serviceEntryForm = reactive(defaultServiceEntryForm())

const showDeleteServiceEntryDialog = ref(false)
const deleteServiceEntryTarget = ref<ServiceHistoryEntry | null>(null)
const deleteServiceEntryLoading = ref(false)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (time: string | null) => {
  if (!time) return '—'
  return time.substring(0, 5)
}

const isOverdue = (date: string | null) => {
  if (!date) return false
  return new Date(date) < new Date()
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'default',
    prospect: 'info',
    suspended: 'error'
  }
  return map[status] ?? 'default'
}

// ─── Data loading ─────────────────────────────────────────────────────────────
const loadError = ref('')
const loadClients = async () => {
  loading.value = true
  loadError.value = ''
  try {
    clients.value = await $fetch<Client[]>('/api/clients', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
  } catch (err: any) {
    clients.value = []
    loadError.value = err?.data?.message || err?.message || 'Failed to load clients.'
  } finally {
    loading.value = false
  }
}

const loadServiceHistory = async (clientId: number) => {
  serviceHistoryLoading.value = true
  try {
    serviceHistory.value = await $fetch<ServiceHistoryEntry[]>(`/api/clients/${clientId}/service-history`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
  } catch {
    serviceHistory.value = []
  } finally {
    serviceHistoryLoading.value = false
  }
}

// ─── Client CRUD ─────────────────────────────────────────────────────────────
const openAddClientDialog = () => {
  editingClient.value = null
  Object.assign(clientForm, defaultClientForm())
  clientFeedback.value = ''
  showClientDialog.value = true
}

const openEditClientDialog = (client: Client) => {
  editingClient.value = client
  Object.assign(clientForm, {
    companyName: client.company_name,
    companyRegistration: client.company_registration,
    industry: client.industry,
    relationshipAllocation: client.relationship_allocation,
    annualRevenue: client.annual_revenue,
    status: client.status,
    address: client.address,
    name: client.name,
    surname: client.surname,
    email: client.email,
    mobileNumber: client.mobile_number,
    landlineNumber: client.landline_number,
    serviceType: client.service_type,
    lastServiced: client.last_serviced ?? '',
    nextServiceDue: client.next_service_due ?? '',
    contractRenewalDate: client.contract_renewal_date ?? '',
    specialRequirements: client.special_requirements,
    regFlagsNotes: client.reg_flags_notes
  })
  clientFeedback.value = ''
  showClientDialog.value = true
}

const submitClientForm = async () => {
  if (!clientForm.companyName) {
    clientFeedback.value = 'Company name is required.'
    clientFeedbackType.value = 'error'
    return
  }
  clientLoading.value = true
  clientFeedback.value = ''
  try {
    const payload = {
      companyName: clientForm.companyName,
      companyRegistration: clientForm.companyRegistration,
      industry: clientForm.industry,
      relationshipAllocation: clientForm.relationshipAllocation,
      annualRevenue: clientForm.annualRevenue,
      status: clientForm.status,
      address: clientForm.address,
      name: clientForm.name,
      surname: clientForm.surname,
      email: clientForm.email,
      mobileNumber: clientForm.mobileNumber,
      landlineNumber: clientForm.landlineNumber,
      serviceType: clientForm.serviceType,
      lastServiced: clientForm.lastServiced || null,
      nextServiceDue: clientForm.nextServiceDue || null,
      contractRenewalDate: clientForm.contractRenewalDate || null,
      specialRequirements: clientForm.specialRequirements,
      regFlagsNotes: clientForm.regFlagsNotes
    }

    if (editingClient.value) {
      await $fetch(`/api/clients/${editingClient.value.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: payload
      })
      clientFeedback.value = 'Client updated.'
    } else {
      await $fetch('/api/clients', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: payload
      })
      clientFeedback.value = 'Client added.'
    }
    clientFeedbackType.value = 'success'
    await loadClients()
    setTimeout(() => { showClientDialog.value = false }, 800)
  } catch {
    clientFeedback.value = 'Something went wrong. Please try again.'
    clientFeedbackType.value = 'error'
  } finally {
    clientLoading.value = false
  }
}

const openDeleteClientDialog = (client: Client) => {
  deleteClientTarget.value = client
  deleteClientFeedback.value = ''
  showDeleteClientDialog.value = true
}

const submitDeleteClient = async () => {
  if (!deleteClientTarget.value) return
  deleteClientLoading.value = true
  try {
    await $fetch(`/api/clients/${deleteClientTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    await loadClients()
    showDeleteClientDialog.value = false
  } catch {
    deleteClientFeedback.value = 'Failed to delete client.'
    deleteClientFeedbackType.value = 'error'
  } finally {
    deleteClientLoading.value = false
  }
}

// ─── Service history CRUD ─────────────────────────────────────────────────────
const openServiceHistoryDialog = async (client: Client) => {
  serviceHistoryClient.value = client
  showServiceHistoryDialog.value = true
  await loadServiceHistory(client.id)
}

const openAddServiceHistoryDialog = () => {
  editingServiceEntry.value = null
  Object.assign(serviceEntryForm, defaultServiceEntryForm())
  serviceEntryFeedback.value = ''
  showServiceEntryDialog.value = true
}

const openEditServiceHistoryDialog = (entry: ServiceHistoryEntry) => {
  editingServiceEntry.value = entry
  Object.assign(serviceEntryForm, {
    serviceDate: entry.service_date,
    serviceTime: entry.service_time.substring(0, 5),
    serviceCompleted: entry.service_completed,
    staffOnSite: entry.staff_on_site,
    additionalInfo: entry.additional_info
  })
  serviceEntryFeedback.value = ''
  showServiceEntryDialog.value = true
}

const submitServiceEntryForm = async () => {
  if (!serviceEntryForm.serviceDate || !serviceEntryForm.serviceTime) {
    serviceEntryFeedback.value = 'Date and time are required.'
    serviceEntryFeedbackType.value = 'error'
    return
  }
  serviceEntryLoading.value = true
  serviceEntryFeedback.value = ''
  try {
    const body = {
      serviceDate: serviceEntryForm.serviceDate,
      serviceTime: serviceEntryForm.serviceTime,
      serviceCompleted: serviceEntryForm.serviceCompleted,
      staffOnSite: serviceEntryForm.staffOnSite,
      additionalInfo: serviceEntryForm.additionalInfo
    }

    if (editingServiceEntry.value) {
      await $fetch(`/api/clients/service-history/${editingServiceEntry.value.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body
      })
    } else {
      await $fetch(`/api/clients/${serviceHistoryClient.value!.id}/service-history`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body
      })
    }
    serviceEntryFeedback.value = editingServiceEntry.value ? 'Entry updated.' : 'Entry added.'
    serviceEntryFeedbackType.value = 'success'
    await loadServiceHistory(serviceHistoryClient.value!.id)
    setTimeout(() => { showServiceEntryDialog.value = false }, 700)
  } catch {
    serviceEntryFeedback.value = 'Something went wrong. Please try again.'
    serviceEntryFeedbackType.value = 'error'
  } finally {
    serviceEntryLoading.value = false
  }
}

const openDeleteServiceHistoryDialog = (entry: ServiceHistoryEntry) => {
  deleteServiceEntryTarget.value = entry
  showDeleteServiceEntryDialog.value = true
}

const submitDeleteServiceEntry = async () => {
  if (!deleteServiceEntryTarget.value) return
  deleteServiceEntryLoading.value = true
  try {
    await $fetch(`/api/clients/service-history/${deleteServiceEntryTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    await loadServiceHistory(serviceHistoryClient.value!.id)
    showDeleteServiceEntryDialog.value = false
  } finally {
    deleteServiceEntryLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(loadClients)

</script>

<style scoped>
.client-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.client-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.client-card__strip {
  height: 4px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
}
</style>
