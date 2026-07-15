<template>
  <DashboardLayout>
    <v-card rounded="xl" elevation="2" class="pa-2 pa-md-3">
      <v-row>
        <v-col cols="12" lg="4">
          <v-card variant="outlined" rounded="lg">
            <v-card-text class="pb-0">
              <div class="d-flex align-center justify-space-between mb-2">
                <v-text-field
                  v-model="userSearch"
                  label="Search users"
                  prepend-inner-icon="mdi-account-search"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="flex-grow-1 mr-2"
                />
                <v-btn size="small" color="primary" variant="flat" icon="mdi-account-plus" @click="showCreateUserDialog = true" />
              </div>
            </v-card-text>

            <v-list lines="two" class="directory-list" nav>
              <v-list-item
                v-for="user in filteredUsers"
                :key="user.id"
                :active="selectedUserId === user.id"
                rounded="lg"
                @click="selectedUserId = user.id"
              >
                <template #prepend>
                  <v-avatar :color="roleColor(user.role)" variant="tonal" size="36">
                    {{ (user.profile?.displayName || user.name).charAt(0).toUpperCase() }}
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">{{ user.profile?.displayName || user.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  @{{ user.username }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip size="x-small" :color="roleColor(user.role)" variant="tonal">{{ user.role }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <v-card v-if="selectedUser" variant="outlined" rounded="lg">
            <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-2">
              <div class="d-flex align-center ga-2">
                <v-avatar :color="roleColor(selectedUser.role)" variant="tonal" size="40">
                  {{ (selectedUser.profile?.displayName || selectedUser.name).charAt(0).toUpperCase() }}
                </v-avatar>
                <span>{{ selectedUser.profile?.displayName || selectedUser.name }}</span>
              </div>
              <div class="d-flex align-center ga-2 flex-wrap">
                <v-chip size="small" :color="roleColor(selectedUser.role)" variant="tonal">{{ selectedUser.role }}</v-chip>
                <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-account-edit" @click="openEditUser(selectedUser)">
                  Edit
                </v-btn>
              </div>
            </v-card-title>

            <v-card-subtitle class="pb-0">
              @{{ selectedUser.username }}
            </v-card-subtitle>

            <v-card-text>
              <v-card variant="tonal" color="secondary" rounded="lg" class="pa-3">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon icon="mdi-domain" color="secondary" />
                  <span class="text-subtitle-2 font-weight-bold">Company</span>
                  <v-chip size="x-small" color="secondary" variant="flat">
                    {{ currentCompanyName }}
                  </v-chip>
                </div>
                <p class="text-caption text-medium-emphasis mb-0">
                  Company assignment is controlled by system administrators.
                </p>
              </v-card>
            </v-card-text>
          </v-card>

          <v-card v-else variant="outlined" rounded="lg" class="pa-8 text-center">
            <v-icon icon="mdi-account" size="48" color="primary" class="mb-3 opacity-40" />
            <p class="text-medium-emphasis">Select a user from the list to view details.</p>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </DashboardLayout>

  <v-dialog v-model="showCreateUserDialog" max-width="520" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon icon="mdi-account-plus" />
        Create New User
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="createUserForm.name"
          label="Full Name"
          prepend-inner-icon="mdi-badge-account"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-text-field
          v-model="createUserForm.username"
          label="Username"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-text-field
          v-model="createUserForm.password"
          label="Password"
          type="password"
          prepend-inner-icon="mdi-lock"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-select
          v-model="createUserForm.role"
          :items="roleOptionsForClientAdmin"
          item-title="title"
          item-value="value"
          label="Role"
          prepend-inner-icon="mdi-shield-account"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />

        <v-divider class="mb-3" />
        <p class="text-caption text-medium-emphasis mb-2">Module Access Permissions (optional)</p>
        <div class="d-flex flex-column ga-1">
          <v-checkbox
            v-for="module in assignableModuleOptions"
            :key="module.value"
            v-model="createUserForm.modules"
            :value="module.value"
            density="compact"
            hide-details
          >
            <template #label>
              <div class="d-flex align-center ga-2">
                <v-icon :icon="module.icon" size="small" />
                <span class="text-body-2">{{ module.title }}</span>
              </div>
            </template>
          </v-checkbox>
        </div>

        <v-alert v-if="createUserError" type="error" variant="tonal" density="compact" class="mt-2">{{ createUserError }}</v-alert>
        <v-alert v-if="createUserSuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ createUserSuccess }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="createUserLoading" @click="showCreateUserDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-account-plus" :loading="createUserLoading" @click="submitCreateUser">Create User</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showEditUserDialog" max-width="520" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon icon="mdi-account-edit" />
        Edit User
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="editUserForm.name"
              label="Full Name"
              prepend-inner-icon="mdi-badge-account"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="editUserForm.username"
              label="Username"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="editUserForm.displayName"
              label="Display Name"
              prepend-inner-icon="mdi-card-account-details"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="editUserForm.phone"
              label="Phone"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="editUserForm.location"
              label="Default Site / Location"
              prepend-inner-icon="mdi-map-marker"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="editUserForm.role"
              :items="roleOptionsForClientAdmin"
              item-title="title"
              item-value="value"
              label="Role"
              prepend-inner-icon="mdi-shield-account"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="editUserForm.bio"
              label="Bio"
              prepend-inner-icon="mdi-text"
              variant="outlined"
              density="comfortable"
              rows="2"
              auto-grow
            />
          </v-col>

          <v-col cols="12">
            <v-divider class="mb-3" />
            <p class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon icon="mdi-view-grid-outline" size="small" class="mr-1" />
              Module Access Permissions
            </p>
            <p class="text-caption text-medium-emphasis mb-3">
              Select which modules this user can access.
            </p>
            <div class="d-flex flex-column ga-1">
              <v-checkbox
                v-for="module in assignableModuleOptions"
                :key="module.value"
                v-model="editUserForm.modules"
                :value="module.value"
                density="compact"
                hide-details
              >
                <template #label>
                  <div class="d-flex align-center ga-2">
                    <v-icon :icon="module.icon" size="small" />
                    <span class="text-body-2">{{ module.title }}</span>
                  </div>
                </template>
              </v-checkbox>
            </div>
          </v-col>

          <v-col cols="12">
            <v-divider class="mb-3" />
            <p class="text-caption text-medium-emphasis mb-2">Leave password blank to keep unchanged.</p>
            <v-text-field
              v-model="editUserForm.newPassword"
              label="New Password"
              type="password"
              prepend-inner-icon="mdi-lock-reset"
              variant="outlined"
              density="comfortable"
              hint="Minimum 8 characters"
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-alert v-if="editUserError" type="error" variant="tonal" density="compact" class="mt-2">{{ editUserError }}</v-alert>
        <v-alert v-if="editUserSuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ editUserSuccess }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="editUserLoading" @click="showEditUserDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="editUserLoading" @click="submitEditUser">Save Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { AppUser, Company } from '~/composables/useAuth'

const {
  currentUser,
  isClientAdmin,
  getAvailableModules,
  initAuth,
  users,
  loadUsers,
  updateUser,
  companies,
  loadCompanies,
  authToken
} = useAuth()

const userSearch = ref('')
const selectedUserId = ref<number | null>(null)

const showCreateUserDialog = ref(false)
const showEditUserDialog = ref(false)
const editUserTarget = ref<AppUser | null>(null)

const createUserForm = reactive({
  name: '',
  username: '',
  password: '',
  role: 'user' as AppUser['role'],
  modules: [] as string[]
})

const editUserForm = reactive({
  name: '',
  username: '',
  displayName: '',
  phone: '',
  location: '',
  bio: '',
  role: 'user' as AppUser['role'],
  newPassword: '',
  modules: [] as string[]
})

const createUserError = ref('')
const createUserSuccess = ref('')
const createUserLoading = ref(false)

const editUserError = ref('')
const editUserSuccess = ref('')
const editUserLoading = ref(false)

const moduleOptions = [
  { title: 'Vehicle Module', value: 'vehicle', icon: 'mdi-car' },
  { title: 'Equipment Module', value: 'equipment', icon: 'mdi-toolbox' },
  { title: 'Cleaning Module', value: 'cleaning', icon: 'mdi-spray-bottle' },
  { title: 'QR Codes Module', value: 'qr-codes', icon: 'mdi-qrcode' },
  { title: 'Clients Module', value: 'clients', icon: 'mdi-account-tie' },
  { title: 'HR Module', value: 'hr', icon: 'mdi-account-group' }
]

const roleOptionsForClientAdmin = [
  { title: 'Staff', value: 'staff' },
  { title: 'Client Technician', value: 'client_technician' }
]

const assignableModuleOptions = computed(() => {
  const allowed = new Set(getAvailableModules.value || [])
  return moduleOptions.filter(option => allowed.has(option.value))
})

const currentCompanyId = computed(() => {
  const userId = currentUser.value?.id
  if (!userId) return null
  const company = companies.value.find((c: Company) => c.linkedUserIds.includes(userId))
  return company?.id ?? null
})

const currentCompanyName = computed(() => {
  const company = companies.value.find((c: Company) => c.id === currentCompanyId.value)
  return company?.name || 'Unassigned'
})

const filteredUsers = computed(() => {
  const term = userSearch.value.trim().toLowerCase()
  if (!term) {
    return users.value
  }

  return users.value.filter(user =>
    [
      user.name,
      user.username,
      user.role,
      user.profile?.displayName || '',
      user.profile?.location || ''
    ].some(value => value.toLowerCase().includes(term))
  )
})

const selectedUser = computed(() => {
  if (!selectedUserId.value) {
    return filteredUsers.value[0] || null
  }
  return filteredUsers.value.find(user => user.id === selectedUserId.value) || filteredUsers.value[0] || null
})

const roleColor = (role: string) => {
  if (role === 'staff') return 'warning'
  if (role === 'cleaner') return 'teal'
  if (role === 'uv-hero') return 'purple'
  if (role === 'client_admin') return 'green'
  if (role === 'client_technician') return 'cyan'
  return 'primary'
}

const loadModulesForUser = async (userId: number) => {
  const result = await $fetch<{ modules: string[] }>(`/api/users/${userId}/modules`, {
    headers: { Authorization: `Bearer ${authToken.value}` }
  })
  return result.modules || []
}

const saveModulesForUser = async (userId: number, modules: string[]) => {
  await $fetch(`/api/users/${userId}/modules`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authToken.value}` },
    body: { modules }
  })
}

const submitCreateUser = async () => {
  createUserError.value = ''
  createUserSuccess.value = ''

  if (!currentCompanyId.value) {
    createUserError.value = 'Your account is not linked to a company. Please contact an admin.'
    return
  }

  createUserLoading.value = true
  try {
    const response = await $fetch<{ id: number; name: string }>('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        name: createUserForm.name,
        username: createUserForm.username,
        password: createUserForm.password,
        role: createUserForm.role,
        companyId: currentCompanyId.value
      }
    })

    if (createUserForm.modules.length > 0 && response.id) {
      await saveModulesForUser(response.id, createUserForm.modules)
    }

    await loadUsers()

    createUserSuccess.value = `User "${response.name}" created successfully.`
    createUserForm.name = ''
    createUserForm.username = ''
    createUserForm.password = ''
    createUserForm.role = 'user'
    createUserForm.modules = []

    setTimeout(() => {
      showCreateUserDialog.value = false
      createUserSuccess.value = ''
    }, 1200)
  } catch (error: any) {
    createUserError.value = error?.data?.message || error?.message || 'Failed to create user.'
  } finally {
    createUserLoading.value = false
  }
}

const openEditUser = async (user: AppUser) => {
  editUserTarget.value = user
  editUserForm.name = user.name
  editUserForm.username = user.username
  editUserForm.displayName = user.profile?.displayName || user.name
  editUserForm.phone = user.profile?.phone || ''
  editUserForm.location = user.profile?.location || ''
  editUserForm.bio = user.profile?.bio || ''
  editUserForm.role = user.role
  editUserForm.newPassword = ''
  editUserForm.modules = await loadModulesForUser(user.id)
  editUserError.value = ''
  editUserSuccess.value = ''
  showEditUserDialog.value = true
}

const submitEditUser = async () => {
  if (!editUserTarget.value) return

  editUserError.value = ''
  editUserSuccess.value = ''
  editUserLoading.value = true

  try {
    const payload: Parameters<typeof updateUser>[1] = {
      name: editUserForm.name.trim() || undefined,
      username: editUserForm.username.trim() || undefined,
      displayName: editUserForm.displayName.trim() || undefined,
      phone: editUserForm.phone.trim(),
      location: editUserForm.location.trim(),
      bio: editUserForm.bio.trim(),
      role: editUserForm.role
    }

    if (editUserForm.newPassword.trim()) {
      payload.newPassword = editUserForm.newPassword
    }

    const result = await updateUser(editUserTarget.value.id, payload)
    if (!result.ok) {
      editUserError.value = result.message
      return
    }

    await saveModulesForUser(editUserTarget.value.id, editUserForm.modules)
    editUserSuccess.value = 'User updated successfully.'

    setTimeout(() => {
      showEditUserDialog.value = false
      editUserSuccess.value = ''
    }, 1000)
  } catch (error: any) {
    editUserError.value = error?.data?.message || error?.message || 'Update failed.'
  } finally {
    editUserLoading.value = false
  }
}

watch(filteredUsers, (nextUsers) => {
  if (nextUsers.length === 0) {
    selectedUserId.value = null
    return
  }

  if (!nextUsers.some(user => user.id === selectedUserId.value)) {
    selectedUserId.value = nextUsers[0].id
  }
}, { immediate: true })

onMounted(async () => {
  await initAuth()
  await Promise.all([loadUsers(), loadCompanies()])

  if (!currentUser.value || !isClientAdmin.value) {
    navigateTo('/')
  }
})
</script>
