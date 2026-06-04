<template>
  <ModuleLayout
    title="HR Management"
    description="Manage staff information and records"
    icon="mdi-account-group"
  >
    <!-- Actions bar -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search staff..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 320px;"
      />
      <div class="d-flex ga-2 align-center flex-wrap">
        <v-btn-toggle v-model="filterActive" density="compact" variant="outlined" rounded="lg">
          <v-btn value="all" size="small">All</v-btn>
          <v-btn value="active" size="small">Active</v-btn>
          <v-btn value="inactive" size="small">Inactive</v-btn>
        </v-btn-toggle>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          variant="flat"
          @click="openAddStaffDialog"
        >
          Add Staff Member
        </v-btn>
      </div>
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
    <v-card v-else-if="filteredStaff.length === 0" rounded="xl" elevation="2" class="pa-8 text-center">
      <v-icon icon="mdi-account-off" size="64" color="grey-lighten-1" class="mb-4" />
      <h3 class="text-h6 mb-2">{{ search ? 'No staff found' : 'No staff members yet' }}</h3>
      <p class="text-medium-emphasis mb-4">
        {{ search ? 'Try a different search term.' : 'Add your first staff member to get started.' }}
      </p>
      <v-btn v-if="!search" color="primary" prepend-icon="mdi-account-plus" @click="openAddStaffDialog">
        Add Your First Staff Member
      </v-btn>
    </v-card>

    <!-- Staff cards grid -->
    <v-row v-else dense>
      <v-col cols="12" sm="6" lg="4" v-for="member in filteredStaff" :key="member.id">
        <v-card rounded="xl" elevation="2" class="staff-card">
          <div class="staff-card__strip" :class="member.is_active ? 'strip--active' : 'strip--inactive'" />
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between ga-2 mb-3">
              <div class="d-flex align-center ga-3">
                <v-avatar color="primary" size="44">
                  <span class="text-body-1 font-weight-bold text-white">
                    {{ initials(member.name, member.surname) }}
                  </span>
                </v-avatar>
                <div>
                  <h3 class="text-h6 font-weight-bold">{{ member.name }} {{ member.surname }}</h3>
                  <p class="text-body-2 text-medium-emphasis" v-if="member.role">{{ member.role }}</p>
                </div>
              </div>
              <v-chip
                :color="member.is_active ? 'success' : 'default'"
                size="x-small"
                variant="tonal"
                class="flex-shrink-0"
              >
                {{ member.is_active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>

            <div class="d-flex flex-column ga-1">
              <div v-if="member.team_allocation" class="d-flex align-center ga-2">
                <v-icon icon="mdi-account-group" size="15" color="grey" />
                <span class="text-body-2">{{ member.team_allocation }}</span>
              </div>
              <div v-if="member.mobile_number" class="d-flex align-center ga-2">
                <v-icon icon="mdi-cellphone" size="15" color="grey" />
                <span class="text-body-2">{{ member.mobile_number }}</span>
              </div>
              <div v-if="member.email" class="d-flex align-center ga-2">
                <v-icon icon="mdi-email" size="15" color="grey" />
                <span class="text-body-2">{{ member.email }}</span>
              </div>
              <div v-if="member.contract_renewal_date" class="d-flex align-center ga-2">
                <v-icon icon="mdi-file-sign" size="15" :color="isOverdue(member.contract_renewal_date) ? 'error' : 'grey'" />
                <span class="text-body-2" :class="isOverdue(member.contract_renewal_date) ? 'text-error' : ''">
                  Contract: {{ formatDate(member.contract_renewal_date) }}
                </span>
              </div>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-spacer />
            <v-btn
              v-if="isAdmin || isClientAdmin"
              variant="text"
              color="secondary"
              size="small"
              icon="mdi-pencil"
              @click="openEditStaffDialog(member)"
            />
            <v-btn
              v-if="isAdmin || isClientAdmin"
              variant="text"
              color="error"
              size="small"
              icon="mdi-delete"
              @click="openDeleteStaffDialog(member)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── Add / Edit Staff Dialog ─── -->
    <v-dialog v-model="showStaffDialog" max-width="760" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2">
            <v-icon :icon="editingStaff ? 'mdi-pencil' : 'mdi-account-plus'" color="primary" />
            {{ editingStaff ? 'Edit Staff Member' : 'Add Staff Member' }}
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="staffFormRef">
            <!-- Personal info -->
            <p class="text-overline text-medium-emphasis mb-2">Personal Information</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.name"
                  label="Name *"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.surname"
                  label="Surname *"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.idNumber"
                  label="ID Number"
                  prepend-inner-icon="mdi-card-account-details"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="staffForm.gender"
                  label="Gender"
                  :items="['Male', 'Female']"
                  prepend-inner-icon="mdi-gender-male-female"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="staffForm.address"
                  label="Address"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Contact info -->
            <p class="text-overline text-medium-emphasis mt-3 mb-2">Contact Details</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.email"
                  label="Email"
                  type="email"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.mobileNumber"
                  label="Mobile Number"
                  prepend-inner-icon="mdi-cellphone"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.landlineNumber"
                  label="Landline Number"
                  prepend-inner-icon="mdi-phone-classic"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Next of kin -->
            <p class="text-overline text-medium-emphasis mt-3 mb-2">Next of Kin</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.nextOfKin"
                  label="Next of Kin"
                  prepend-inner-icon="mdi-account-heart"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.nextOfKinMobile"
                  label="Next of Kin Mobile Number"
                  prepend-inner-icon="mdi-cellphone"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Employment info -->
            <p class="text-overline text-medium-emphasis mt-3 mb-2">Employment Details</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.role"
                  label="Role"
                  prepend-inner-icon="mdi-briefcase"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.teamAllocation"
                  label="Team Allocation"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.dateJoined"
                  label="Date Joined"
                  type="date"
                  prepend-inner-icon="mdi-calendar-account"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.contractRenewalDate"
                  label="Contract Renewal Date"
                  type="date"
                  prepend-inner-icon="mdi-file-sign"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.salary"
                  label="Salary"
                  type="number"
                  prepend-inner-icon="mdi-currency-usd"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="staffForm.frequencyPaid"
                  label="Frequency Paid"
                  :items="['Weekly', 'Fortnightly', 'Monthly']"
                  prepend-inner-icon="mdi-calendar-repeat"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.traxNumber"
                  label="TRax Number"
                  prepend-inner-icon="mdi-identifier"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="staffForm.uifNumber"
                  label="UIF Number"
                  prepend-inner-icon="mdi-shield-account"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="staffForm.isActive"
                  label="Active Employee"
                  color="success"
                  hide-details
                  density="comfortable"
                  inset
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="staffForm.additionalInformation"
                  label="Additional Information (optional)"
                  prepend-inner-icon="mdi-text"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                />
              </v-col>
            </v-row>
          </v-form>
          <v-alert v-if="staffFeedback" :type="staffFeedbackType" variant="tonal" density="compact" class="mt-3">
            {{ staffFeedback }}
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-5 py-4">
          <v-spacer />
          <v-btn variant="text" @click="showStaffDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="editingStaff ? 'mdi-content-save' : 'mdi-check'"
            :loading="staffLoading"
            @click="submitStaffForm"
          >
            {{ editingStaff ? 'Save Changes' : 'Add Staff Member' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Delete Staff Dialog ─── -->
    <v-dialog v-model="showDeleteStaffDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <div class="d-flex align-center ga-2 text-error">
            <v-icon icon="mdi-account-remove" />
            Delete Staff Member
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-1">
          <p>Are you sure you want to delete <strong>{{ deleteStaffTarget ? `${deleteStaffTarget.name} ${deleteStaffTarget.surname}` : '' }}</strong>?</p>
          <p class="text-medium-emphasis text-caption mt-2">This action cannot be undone.</p>
          <v-alert v-if="deleteStaffFeedback" :type="deleteStaffFeedbackType" variant="tonal" density="compact" class="mt-3">
            {{ deleteStaffFeedback }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" :disabled="deleteStaffLoading" @click="showDeleteStaffDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteStaffLoading" @click="submitDeleteStaff">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </ModuleLayout>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const { authToken, isAdmin, isClientAdmin, initAuth } = useAuth()
initAuth()

// ─── Types ───────────────────────────────────────────────────────────────────
interface StaffMember {
  id: number
  name: string
  surname: string
  address: string
  landline_number: string
  email: string
  mobile_number: string
  id_number: string
  gender: string
  next_of_kin: string
  next_of_kin_mobile: string
  date_joined: string | null
  contract_renewal_date: string | null
  trax_number: string
  uif_number: string
  role: string
  team_allocation: string
  salary: number | null
  frequency_paid: string
  additional_information: string
  is_active: boolean
}

// ─── State ───────────────────────────────────────────────────────────────────
const staff = ref<StaffMember[]>([])
const loading = ref(true)
const search = ref('')
const filterActive = ref('all')

const filteredStaff = computed(() => {
  let list = staff.value

  if (filterActive.value === 'active') list = list.filter(m => m.is_active)
  else if (filterActive.value === 'inactive') list = list.filter(m => !m.is_active)

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.surname.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q) ||
      m.team_allocation?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    )
  }

  return list
})

// ─── Staff form state ─────────────────────────────────────────────────────────
const showStaffDialog = ref(false)
const editingStaff = ref<StaffMember | null>(null)
const staffLoading = ref(false)
const staffFeedback = ref('')
const staffFeedbackType = ref<'success' | 'error'>('success')

const defaultStaffForm = () => ({
  name: '',
  surname: '',
  address: '',
  landlineNumber: '',
  email: '',
  mobileNumber: '',
  idNumber: '',
  gender: '',
  nextOfKin: '',
  nextOfKinMobile: '',
  dateJoined: '',
  contractRenewalDate: '',
  traxNumber: '',
  uifNumber: '',
  role: '',
  teamAllocation: '',
  salary: null as number | null,
  frequencyPaid: '',
  additionalInformation: '',
  isActive: true
})

const staffForm = reactive(defaultStaffForm())

// ─── Delete staff state ───────────────────────────────────────────────────────
const showDeleteStaffDialog = ref(false)
const deleteStaffTarget = ref<StaffMember | null>(null)
const deleteStaffLoading = ref(false)
const deleteStaffFeedback = ref('')
const deleteStaffFeedbackType = ref<'success' | 'error'>('success')

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initials = (name: string, surname: string) => {
  return `${name?.[0] ?? ''}${surname?.[0] ?? ''}`.toUpperCase()
}

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

const isOverdue = (date: string | null) => {
  if (!date) return false
  return new Date(date) < new Date()
}

// ─── Data loading ─────────────────────────────────────────────────────────────
const loadError = ref('')
const loadStaff = async () => {
  loading.value = true
  loadError.value = ''
  try {
    staff.value = await $fetch<StaffMember[]>('/api/staff', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
  } catch (err: any) {
    staff.value = []
    loadError.value = err?.data?.message || err?.message || 'Failed to load staff.'
  } finally {
    loading.value = false
  }
}

// ─── Staff CRUD ───────────────────────────────────────────────────────────────
const openAddStaffDialog = () => {
  editingStaff.value = null
  Object.assign(staffForm, defaultStaffForm())
  staffFeedback.value = ''
  showStaffDialog.value = true
}

const openEditStaffDialog = (member: StaffMember) => {
  editingStaff.value = member
  Object.assign(staffForm, {
    name: member.name,
    surname: member.surname,
    address: member.address,
    landlineNumber: member.landline_number,
    email: member.email,
    mobileNumber: member.mobile_number,
    idNumber: member.id_number,
    gender: member.gender,
    nextOfKin: member.next_of_kin,
    nextOfKinMobile: member.next_of_kin_mobile,
    dateJoined: member.date_joined ?? '',
    contractRenewalDate: member.contract_renewal_date ?? '',
    traxNumber: member.trax_number,
    uifNumber: member.uif_number,
    role: member.role,
    teamAllocation: member.team_allocation,
    salary: member.salary,
    frequencyPaid: member.frequency_paid,
    additionalInformation: member.additional_information,
    isActive: member.is_active
  })
  staffFeedback.value = ''
  showStaffDialog.value = true
}

const submitStaffForm = async () => {
  if (!staffForm.name || !staffForm.surname) {
    staffFeedback.value = 'Name and surname are required.'
    staffFeedbackType.value = 'error'
    return
  }
  staffLoading.value = true
  staffFeedback.value = ''
  try {
    const payload = {
      name: staffForm.name,
      surname: staffForm.surname,
      address: staffForm.address,
      landlineNumber: staffForm.landlineNumber,
      email: staffForm.email,
      mobileNumber: staffForm.mobileNumber,
      idNumber: staffForm.idNumber,
      gender: staffForm.gender,
      nextOfKin: staffForm.nextOfKin,
      nextOfKinMobile: staffForm.nextOfKinMobile,
      dateJoined: staffForm.dateJoined || null,
      contractRenewalDate: staffForm.contractRenewalDate || null,
      traxNumber: staffForm.traxNumber,
      uifNumber: staffForm.uifNumber,
      role: staffForm.role,
      teamAllocation: staffForm.teamAllocation,
      salary: staffForm.salary,
      frequencyPaid: staffForm.frequencyPaid,
      additionalInformation: staffForm.additionalInformation,
      isActive: staffForm.isActive
    }

    if (editingStaff.value) {
      await $fetch(`/api/staff/${editingStaff.value.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: payload
      })
      staffFeedback.value = 'Staff member updated.'
    } else {
      await $fetch('/api/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: payload
      })
      staffFeedback.value = 'Staff member added.'
    }
    staffFeedbackType.value = 'success'
    await loadStaff()
    setTimeout(() => { showStaffDialog.value = false }, 800)
  } catch {
    staffFeedback.value = 'Something went wrong. Please try again.'
    staffFeedbackType.value = 'error'
  } finally {
    staffLoading.value = false
  }
}

const openDeleteStaffDialog = (member: StaffMember) => {
  deleteStaffTarget.value = member
  deleteStaffFeedback.value = ''
  showDeleteStaffDialog.value = true
}

const submitDeleteStaff = async () => {
  if (!deleteStaffTarget.value) return
  deleteStaffLoading.value = true
  try {
    await $fetch(`/api/staff/${deleteStaffTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    await loadStaff()
    showDeleteStaffDialog.value = false
  } catch {
    deleteStaffFeedback.value = 'Failed to delete staff member.'
    deleteStaffFeedbackType.value = 'error'
  } finally {
    deleteStaffLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(loadStaff)
</script>

<style scoped>
.staff-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.staff-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.staff-card__strip {
  height: 4px;
}

.strip--active {
  background: linear-gradient(90deg, rgb(var(--v-theme-success)) 0%, #10b981 100%);
}

.strip--inactive {
  background: linear-gradient(90deg, #9ca3af 0%, #6b7280 100%);
}
</style>
