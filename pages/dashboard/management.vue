<template>
  <DashboardLayout>
    <!-- Live service request notification snackbar -->
    <v-snackbar
      v-model="liveRequestSnack"
      location="top right"
      color="warning"
      timeout="8000"
      multi-line
    >
      <v-icon icon="mdi-bell-ring" class="mr-2" />
      {{ liveRequestMsg }}
      <template #actions>
        <v-btn color="white" variant="text" @click="navigateTo('/dashboard/requests'); liveRequestSnack = false">
          View
        </v-btn>
        <v-btn variant="text" @click="liveRequestSnack = false">Dismiss</v-btn>
      </template>
    </v-snackbar>

    <!-- Main content card -->
    <v-card rounded="xl" elevation="2" class="pa-2 pa-md-3">
      <!-- ── Two-pane layout: tabbed left sidebar + detail right ── -->
      <v-row>
        <!-- LEFT: Tabbed pane — Users | Companies -->
        <v-col cols="12" lg="4">
          <v-card variant="outlined" rounded="lg">
            <v-tabs v-model="directoryTab" color="primary" density="comfortable" grow>
              <v-tab value="users" prepend-icon="mdi-account-group">
                Users
                <v-chip size="x-small" color="primary" variant="tonal" class="ml-2">{{ users.length }}</v-chip>
              </v-tab>
              <v-tab v-if="isAdmin" value="companies" prepend-icon="mdi-domain">
                Companies
                <v-chip size="x-small" color="secondary" variant="tonal" class="ml-2">{{ companies.length }}</v-chip>
              </v-tab>
            </v-tabs>

            <v-divider />

            <v-tabs-window v-model="directoryTab">
              <!-- Users tab -->
              <v-tabs-window-item value="users">
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
                    :active="directoryTab === 'users' && selectedUserId === user.id"
                    rounded="lg"
                    @click="selectUser(user.id)"
                  >
                    <template #prepend>
                      <v-avatar :color="roleColor(user.role)" variant="tonal" size="36">
                        {{ (user.profile?.displayName || user.name).charAt(0).toUpperCase() }}
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-medium">{{ user.profile?.displayName || user.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      @{{ user.username }}
                      <v-chip v-if="getUserCompany(user.id)" size="x-small" color="secondary" variant="tonal" class="ml-1">
                        {{ getUserCompany(user.id)!.name }}
                      </v-chip>
                    </v-list-item-subtitle>
                    <template #append>
                      <div class="d-flex flex-column align-end ga-1">
                        <v-chip size="x-small" :color="roleColor(user.role)" variant="tonal">{{ user.role }}</v-chip>
                        <v-chip v-if="user.role === 'user'" size="x-small" color="info" variant="tonal">{{ getRecordCountForUser(user) }} QR</v-chip>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-tabs-window-item>

              <!-- Companies tab -->
              <v-tabs-window-item v-if="isAdmin" value="companies">
                <v-card-text class="pb-0">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <v-text-field
                      v-model="companySearch"
                      label="Search companies"
                      prepend-inner-icon="mdi-domain"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="flex-grow-1 mr-2"
                    />
                    <v-btn size="small" color="primary" variant="flat" icon="mdi-domain-plus" @click="showCreateCompanyDialog = true" />
                  </div>
                </v-card-text>
                <v-alert v-if="companies.length === 0" type="info" variant="tonal" border="start" density="compact" class="mx-3 mb-3">
                  No companies yet. Click <v-icon size="small">mdi-domain-plus</v-icon> to create one.
                </v-alert>
                <v-list lines="two" class="directory-list" nav>
                  <v-list-item
                    v-for="company in filteredCompanies"
                    :key="company.id"
                    :active="directoryTab === 'companies' && selectedCompanyId === company.id"
                    rounded="lg"
                    @click="selectCompany(company.id)"
                  >
                    <template #prepend>
                      <v-avatar color="secondary" variant="tonal" size="36">
                        {{ company.name.charAt(0).toUpperCase() }}
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-medium">{{ company.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ company.linkedUserIds.length }} users linked</v-list-item-subtitle>
                    <template #append>
                      <v-chip size="x-small" color="success" variant="tonal">{{ getRecordsByCompany(company.id).length }} QR</v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </v-col>

        <!-- RIGHT: Detail panel — changes based on what is selected -->
        <v-col cols="12" lg="8">

          <!-- ── User detail ── -->
          <v-card v-if="directoryTab === 'users' && selectedUser" variant="outlined" rounded="lg">
            <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-2">
              <div class="d-flex align-center ga-2">
                <v-avatar :color="roleColor(selectedUser.role)" variant="tonal" size="40">
                  {{ (selectedUser.profile?.displayName || selectedUser.name).charAt(0).toUpperCase() }}
                </v-avatar>
                <span>{{ selectedUser.profile?.displayName || selectedUser.name }}</span>
              </div>
              <div class="d-flex align-center ga-2 flex-wrap">
                <v-chip size="small" :color="roleColor(selectedUser.role)" variant="tonal">{{ selectedUser.role }}</v-chip>
                <v-btn v-if="selectedUser.role === 'user'" size="small" color="success" variant="flat" prepend-icon="mdi-qrcode-plus" @click="openCreateQrForUser(selectedUser.id)">
                  Create QR Code
                </v-btn>
                <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-account-edit" @click="openEditUser(selectedUser)">
                  Edit
                </v-btn>
                <v-btn size="small" color="error" variant="tonal" prepend-icon="mdi-account-remove" @click="openDeleteUser(selectedUser)">
                  Delete
                </v-btn>
              </div>
            </v-card-title>

            <v-card-subtitle class="pb-0">
              @{{ selectedUser.username }} &bull; {{ selectedUser.profile?.location || 'No default site' }}
            </v-card-subtitle>

            <!-- Company assignment — right in context with the user -->
            <v-card-text class="pb-2">
              <v-card variant="tonal" color="secondary" rounded="lg" class="pa-3 mb-4">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon icon="mdi-domain" color="secondary" />
                  <span class="text-subtitle-2 font-weight-bold">Company Assignment</span>
                  <v-chip v-if="getUserCompany(selectedUser.id)" size="x-small" color="secondary" variant="flat">
                    {{ getUserCompany(selectedUser.id)!.name }}
                  </v-chip>
                  <v-chip v-else size="x-small" color="default" variant="outlined">Not assigned</v-chip>
                </div>
                <v-select
                  v-if="isAdmin"
                  :model-value="getUserCompanyId(selectedUser.id)"
                  :items="companySelectItems"
                  item-title="title"
                  item-value="value"
                  label="Assign to Company"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  placeholder="No company assigned"
                  @update:model-value="(id) => assignUserToCompany(selectedUser.id, id)"
                />
                <v-alert
                  v-else
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                >
                  Company assignment is managed by system administrators.
                </v-alert>
              </v-card>

              <!-- Staff / Admin info panel — no QR codes for these roles -->
              <v-alert
                v-if="selectedUser.role === 'staff'"
                type="info"
                variant="tonal"
                border="start"
                class="mb-4"
                icon="mdi-badge-account-outline"
              >
                <strong>Staff member</strong> — staff users scan QR codes on-site to update service records. They do not have QR codes assigned to them.
              </v-alert>

              <v-alert
                v-if="selectedUser.role === 'admin'"
                type="warning"
                variant="tonal"
                border="start"
                class="mb-4"
                icon="mdi-shield-account-outline"
              >
                <strong>Administrator</strong> — admin accounts manage the system and do not have site QR codes assigned to them.
              </v-alert>

              <v-row v-if="selectedUser.role === 'user'" dense class="mb-2">
                <v-col cols="12" md="6">
                  <v-select
                    v-model="siteFilter"
                    :items="siteFilterItems"
                    item-title="label"
                    item-value="value"
                    label="Filter by Site / Room"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="recordSearch"
                    label="Search records"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-alert
                v-if="selectedUser.role === 'user' && filteredUserRecords.length === 0"
                type="info"
                variant="tonal"
                border="start"
                class="mb-2"
              >
                No QR records assigned to this user yet.
              </v-alert>

              <v-row v-if="filteredUserRecords.length > 0" dense>
                <v-col cols="12" v-for="record in filteredUserRecords" :key="`${record.itemType}-${record.id}`">
                  <v-card rounded="lg" variant="tonal" class="pa-2 pa-md-3">
                    <v-row>
                      <v-col cols="12" md="8">
                        <div class="d-flex flex-wrap align-center ga-2 mb-1">
                          <h3 class="text-h6 font-weight-bold">{{ record.displayName || record.name }}</h3>
                          <v-chip size="x-small" color="primary" variant="flat">{{ record.code }}</v-chip>
                          <v-chip v-if="record.itemType === 'record'" size="x-small" color="info" variant="tonal">{{ record.type }}</v-chip>
                          <v-chip v-if="record.itemType === 'vehicle'" size="x-small" color="blue" variant="tonal">Vehicle</v-chip>
                          <v-chip v-if="record.itemType === 'equipment'" size="x-small" color="orange" variant="tonal">Equipment</v-chip>
                          <v-spacer />
                          <v-btn v-if="record.itemType === 'record'" size="x-small" color="primary" variant="tonal" icon="mdi-pencil-outline" @click="openEditRecord(record as any)" />
                          <v-btn v-if="record.itemType === 'record'" size="x-small" color="error" variant="tonal" icon="mdi-delete-outline" @click="openDeleteRecord(record as any)" />
                          <v-btn v-if="record.itemType === 'vehicle'" :to="`/modules/vehicles/${record.id}?from=management`" size="x-small" color="blue" variant="tonal" icon="mdi-eye-outline" />
                          <v-btn v-if="record.itemType === 'vehicle'" size="x-small" color="error" variant="tonal" icon="mdi-delete-outline" @click="openDeleteVehicle(record)" />
                          <v-btn v-if="record.itemType === 'equipment'" :to="`/modules/equipment/${record.id}?from=management`" size="x-small" color="orange" variant="tonal" icon="mdi-eye-outline" />
                          <v-btn v-if="record.itemType === 'equipment'" size="x-small" color="error" variant="tonal" icon="mdi-delete-outline" @click="openDeleteEquipment(record)" />
                        </div>
                        <p class="text-medium-emphasis mb-3">{{ record.displayLocation || record.location }}</p>

                        <v-card v-if="record.itemType === 'record'" variant="outlined" rounded="lg" class="mb-3">
                          <v-card-title class="text-subtitle-1 font-weight-bold">Schedule Checklist (Admin)</v-card-title>
                          <v-card-text>
                            <p class="text-medium-emphasis mb-2">Add tasks with buttons, then save. Staff will tick these in Service Details.</p>

                            <div class="d-grid ga-2 mb-2">
                              <div
                                v-for="(task, taskIndex) in getChecklistItems(record.code)"
                                :key="`${record.code}-${taskIndex}`"
                                class="d-flex flex-wrap ga-2"
                              >
                                <v-text-field
                                  :model-value="task"
                                  label="Task"
                                  density="compact"
                                  variant="outlined"
                                  hide-details
                                  class="flex-grow-1"
                                  @update:model-value="updateChecklistTask(record.code, taskIndex, String($event || ''))"
                                />
                                <v-btn
                                  color="error"
                                  variant="tonal"
                                  prepend-icon="mdi-delete-outline"
                                  @click="removeChecklistTask(record.code, taskIndex)"
                                >
                                  Remove
                                </v-btn>
                              </div>
                            </div>

                            <div class="d-flex flex-wrap ga-2 mb-2">
                              <v-text-field
                                v-model="newTaskByCode[record.code]"
                                label="Add new task"
                                density="compact"
                                variant="outlined"
                                hide-details
                                class="flex-grow-1"
                                @keydown.enter.prevent="addChecklistTask(record.code)"
                              />
                              <v-btn color="primary" prepend-icon="mdi-plus" @click="addChecklistTask(record.code)">Add Task</v-btn>
                            </div>

                            <v-btn color="success" prepend-icon="mdi-content-save" @click="saveChecklistForRecord(record.code)">
                              Save Checklist
                            </v-btn>
                          </v-card-text>
                        </v-card>

                        <v-card variant="outlined" rounded="lg">
                          <v-card-title class="text-subtitle-1 font-weight-bold">Latest Staff Results and Messages</v-card-title>
                          <v-card-text>
                            <v-alert
                              v-if="getRecentEntries(record.code).length === 0"
                              type="info"
                              variant="tonal"
                              border="start"
                            >
                              No service tracking entries yet.
                            </v-alert>

                            <v-expansion-panels v-else variant="accordion">
                              <v-expansion-panel
                                v-for="entry in getRecentEntries(record.code)"
                                :key="entry.id"
                              >
                                <v-expansion-panel-title>
                                  <div class="d-flex flex-wrap align-center ga-2 w-100">
                                    <span class="text-body-2 font-weight-medium">{{ entry.startTime }} → {{ entry.endTime }}</span>
                                    <v-chip size="x-small" :color="statusColor(entry.status)" variant="tonal">{{ entry.status }}</v-chip>
                                    <v-spacer />
                                    <v-chip size="x-small" color="primary" variant="outlined">
                                      {{ entry.checklist.filter(task => task.completed).length }} / {{ entry.checklist.length }} done
                                    </v-chip>
                                  </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                  <p class="text-medium-emphasis mb-2">{{ entry.notes }}</p>
                                  <v-divider class="my-2" />
                                  <p class="text-subtitle-2 mb-2">Thread</p>
                                  <v-alert
                                    v-if="entry.messages.length === 0"
                                    type="info"
                                    variant="tonal"
                                    density="compact"
                                  >
                                    No messages yet.
                                  </v-alert>
                                  <v-timeline v-else density="compact" side="end" align="start">
                                    <v-timeline-item
                                      v-for="message in entry.messages"
                                      :key="message.id"
                                      dot-color="primary"
                                      size="x-small"
                                    >
                                      <div class="text-body-2"><strong>{{ message.fromName }}</strong> ({{ message.fromRole }})</div>
                                      <div class="text-body-2">{{ message.text }}</div>
                                      <small class="text-medium-emphasis">{{ formatDateTime(message.createdAt) }}</small>
                                    </v-timeline-item>
                                  </v-timeline>
                                </v-expansion-panel-text>
                              </v-expansion-panel>
                            </v-expansion-panels>
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" md="4" class="d-flex flex-column align-center justify-center ga-3">
                        <v-card variant="outlined" rounded="lg" class="pa-2">
                          <QrcodeVue :value="toScanUrl(record)" :size="130" level="H" render-as="svg" />
                        </v-card>
                        <v-btn :to="`/scan/${record.code}?from=management`" color="primary" variant="flat" prepend-icon="mdi-open-in-new">
                          Open QR Site
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- ── Company detail ── -->
          <v-card v-else-if="isAdmin && directoryTab === 'companies' && selectedCompany" variant="outlined" rounded="lg">
            <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-2">
              <div class="d-flex align-center ga-2">
                <v-avatar color="secondary" variant="tonal" size="40">
                  {{ selectedCompany.name.charAt(0).toUpperCase() }}
                </v-avatar>
                <span>{{ selectedCompany.name }}</span>
              </div>
              <v-btn size="small" color="success" variant="flat" prepend-icon="mdi-qrcode-plus" @click="openCreateQrForCompany(selectedCompany.id)">
                Create QR Code
              </v-btn>
            </v-card-title>

            <v-card-text>
              <!-- Linked users — manage right here in context -->
              <v-card variant="tonal" color="secondary" rounded="lg" class="pa-3 mb-4">
                <div class="d-flex align-center ga-2 mb-3">
                  <v-icon icon="mdi-account-group" color="secondary" />
                  <span class="text-subtitle-2 font-weight-bold">Linked Users</span>
                  <v-chip size="x-small" color="secondary" variant="flat">{{ selectedCompany.linkedUserIds.length }}</v-chip>
                </div>

                <!-- Current members listed with remove chips -->
                <div v-if="selectedCompany.linkedUserIds.length > 0" class="d-flex flex-wrap ga-2 mb-3">
                  <v-chip
                    v-for="uid in selectedCompany.linkedUserIds"
                    :key="uid"
                    closable
                    size="small"
                    color="secondary"
                    variant="tonal"
                    @click:close="unlinkUserFromCompany(selectedCompany.id, uid)"
                  >
                    <v-avatar start color="secondary" size="20">
                      {{ getUserNameById(uid).charAt(0).toUpperCase() }}
                    </v-avatar>
                    {{ getUserNameById(uid) }}
                  </v-chip>
                </div>
                <p v-else class="text-medium-emphasis text-caption mb-3">No users linked yet.</p>

                <!-- Add user dropdown — only shows unlinked users -->
                <v-autocomplete
                  v-model="addUserToCompanyId"
                  :items="unlinkdUsersForCompany(selectedCompany.id)"
                  item-title="title"
                  item-value="value"
                  label="Add a user to this company"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  placeholder="Search and select a user…"
                  prepend-inner-icon="mdi-account-plus"
                  @update:model-value="(id) => { if (id) { linkUserToCompany(selectedCompany.id, id); addUserToCompanyId = null } }"
                />
              </v-card>

              <!-- QR codes for this company -->
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="text-subtitle-2 font-weight-bold">
                  QR Codes
                  <v-chip size="x-small" color="success" variant="tonal" class="ml-1">{{ getRecordsByCompany(selectedCompany.id).length }}</v-chip>
                </span>
              </div>

              <v-alert v-if="getRecordsByCompany(selectedCompany.id).length === 0" type="info" variant="tonal" border="start" density="compact">
                No QR codes yet. Click "Create QR Code" above to add one.
              </v-alert>

              <v-row v-else dense>
                <v-col cols="12" sm="6" v-for="rec in getRecordsByCompany(selectedCompany.id)" :key="`${rec.itemType}-${rec.id}`">
                  <v-card variant="tonal" rounded="lg" class="pa-3">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div>
                        <div class="font-weight-bold">{{ rec.displayName || rec.name }}</div>
                        <div class="text-medium-emphasis text-caption">{{ rec.displayLocation || rec.location }}</div>
                        <div class="d-flex ga-1 mt-1">
                          <v-chip size="x-small" color="primary" variant="flat">{{ rec.code }}</v-chip>
                          <v-chip v-if="rec.itemType === 'vehicle'" size="x-small" color="blue" variant="tonal">Vehicle</v-chip>
                          <v-chip v-if="rec.itemType === 'equipment'" size="x-small" color="orange" variant="tonal">Equipment</v-chip>
                        </div>
                      </div>
                      <QrcodeVue :value="toScanUrl(rec)" :size="80" level="H" render-as="svg" />
                    </div>
                    <div class="d-flex ga-2 mt-2">
                      <v-btn :to="`/scan/${rec.code}?from=management`" size="small" color="primary" variant="tonal" prepend-icon="mdi-open-in-new" class="flex-grow-1">
                        Open Tracking Page
                      </v-btn>
                      <v-btn v-if="rec.itemType === 'record'" size="small" color="primary" variant="tonal" icon="mdi-pencil-outline" @click="openEditRecord(rec as any)" />
                      <v-btn v-if="rec.itemType === 'record'" size="small" color="error" variant="tonal" icon="mdi-delete-outline" @click="openDeleteRecord(rec as any)" />
                      <v-btn v-if="rec.itemType === 'vehicle'" :to="`/modules/vehicles/${rec.id}?from=management`" size="small" color="blue" variant="tonal" icon="mdi-eye-outline" />
                      <v-btn v-if="rec.itemType === 'vehicle'" size="small" color="error" variant="tonal" icon="mdi-delete-outline" @click="openDeleteVehicle(rec)" />
                      <v-btn v-if="rec.itemType === 'equipment'" :to="`/modules/equipment/${rec.id}?from=management`" size="small" color="orange" variant="tonal" icon="mdi-eye-outline" />
                      <v-btn v-if="rec.itemType === 'equipment'" size="small" color="error" variant="tonal" icon="mdi-delete-outline" @click="openDeleteEquipment(rec)" />
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Empty state when nothing is selected -->
          <v-card v-else variant="outlined" rounded="lg" class="pa-8 text-center">
            <v-icon :icon="directoryTab === 'companies' ? 'mdi-domain' : 'mdi-account'" size="48" color="primary" class="mb-3 opacity-40" />
            <p class="text-medium-emphasis">
              {{ directoryTab === 'companies' ? 'Select a company from the list to view details.' : 'Select a user from the list to view details.' }}
            </p>
          </v-card>

        </v-col>
      </v-row>
    </v-card>
  </DashboardLayout>

  <!-- ── Create User Dialog ──────────────────────────────────────────────── -->
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
          :items="isClientAdmin ? roleOptionsForClientAdmin : roleOptions"
          item-title="title"
          item-value="value"
          label="Role"
          prepend-inner-icon="mdi-shield-account"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-select
          v-if="isAdmin && isClientRole(createUserForm.role)"
          v-model="createUserForm.companyId"
          :items="companies.map(c => ({ title: c.name, value: c.id }))"
          item-title="title"
          item-value="value"
          label="Assign to Company"
          prepend-inner-icon="mdi-domain"
          variant="outlined"
          density="comfortable"
          :hint="isClientRole(createUserForm.role) ? 'Required for client roles' : ''"
          persistent-hint
          class="mb-3"
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

  <!-- ── Create QR Code Dialog ─────────────────────────────────────────── -->
  <v-dialog v-model="showCreateQrDialog" max-width="460" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon icon="mdi-qrcode-plus" />
        Create QR Code
        <span v-if="createQrTarget.type === 'user'" class="text-body-2 text-medium-emphasis ml-1">for {{ getUserNameById(createQrTarget.id!) }}</span>
        <span v-else-if="createQrTarget.type === 'company'" class="text-body-2 text-medium-emphasis ml-1">for {{ getCompanyNameById(createQrTarget.id!) }}</span>
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="createQrForm.name"
          label="QR Code Name / Label"
          prepend-inner-icon="mdi-tag-outline"
          variant="outlined"
          density="comfortable"
          placeholder="e.g. Ground Floor Kitchen"
          class="mb-2"
        />
        <v-text-field
          v-model="createQrForm.location"
          label="Location / Room"
          prepend-inner-icon="mdi-map-marker-outline"
          variant="outlined"
          density="comfortable"
          placeholder="e.g. Building A - Room 3"
          class="mb-2"
        />
        <v-alert v-if="createQrError" type="error" variant="tonal" density="compact" class="mt-2">{{ createQrError }}</v-alert>
        <v-alert v-if="createQrSuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ createQrSuccess }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showCreateQrDialog = false">Cancel</v-btn>
        <v-btn color="success" variant="flat" prepend-icon="mdi-qrcode-plus" @click="submitCreateQrCode">Create QR Code</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Edit User Dialog ──────────────────────────────────────────────── -->
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
              :items="isClientAdmin ? roleOptionsForClientAdmin : roleOptions"
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
          <v-col v-if="isAdmin || isClientAdmin" cols="12">
            <v-divider class="mb-3" />
            <p class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon icon="mdi-view-grid-outline" size="small" class="mr-1" />
              Module Access Permissions
            </p>
            <p class="text-caption text-medium-emphasis mb-3">
              Select which modules this user can access. Admin users have full access to all modules.
            </p>
            <v-alert v-if="editUserForm.role === 'admin'" type="info" variant="tonal" density="compact" class="mb-3">
              <strong>Admin users</strong> have access to all modules automatically.
            </v-alert>
            <div v-else class="d-flex flex-column ga-1">
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

  <!-- ── Delete User Confirm Dialog ───────────────────────────────────────── -->
  <v-dialog v-model="showDeleteUserDialog" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2 text-error">
        <v-icon icon="mdi-account-remove" />
        Delete User
      </v-card-title>
      <v-card-text>
        <p>Are you sure you want to permanently delete <strong>{{ deleteUserTarget?.profile?.displayName || deleteUserTarget?.name }}</strong> (@{{ deleteUserTarget?.username }})?</p>
        <p class="text-medium-emphasis text-caption mt-2">This will remove their account, profile, and all associated records. This cannot be undone.</p>
        <v-alert v-if="deleteUserError" type="error" variant="tonal" density="compact" class="mt-3">{{ deleteUserError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="deleteUserLoading" @click="showDeleteUserDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" prepend-icon="mdi-delete" :loading="deleteUserLoading" @click="submitDeleteUser">Delete Permanently</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Edit QR Record Dialog ─────────────────────────────────────────── -->
  <v-dialog v-model="showEditRecordDialog" max-width="480" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon icon="mdi-qrcode-edit" />
        Edit QR Code
        <v-chip v-if="editRecordTarget" size="x-small" color="primary" variant="flat" class="ml-1">{{ editRecordTarget.code }}</v-chip>
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field v-model="editRecordForm.name" label="Name / Label" prepend-inner-icon="mdi-tag-outline" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="editRecordForm.type" label="Type" prepend-inner-icon="mdi-shape-outline" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="editRecordForm.location" label="Location / Room" prepend-inner-icon="mdi-map-marker-outline" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="editRecordForm.description" label="Description" prepend-inner-icon="mdi-text" variant="outlined" density="comfortable" />
          </v-col>
        </v-row>
        <v-alert v-if="editRecordError" type="error" variant="tonal" density="compact" class="mt-2">{{ editRecordError }}</v-alert>
        <v-alert v-if="editRecordSuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ editRecordSuccess }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="editRecordLoading" @click="showEditRecordDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="editRecordLoading" @click="submitEditRecord">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Delete QR Record Confirm Dialog ──────────────────────────────────── -->
  <v-dialog v-model="showDeleteRecordDialog" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2 text-error">
        <v-icon icon="mdi-qrcode-remove" />
        Delete QR Code
      </v-card-title>
      <v-card-text>
        <p>Delete QR code <strong>{{ deleteRecordTarget?.code }}</strong> (<em>{{ deleteRecordTarget?.name }}</em>)?</p>
        <p class="text-medium-emphasis text-caption mt-2">All service entries and checklist templates for this record will also be deleted. This cannot be undone.</p>
        <v-alert v-if="deleteRecordError" type="error" variant="tonal" density="compact" class="mt-3">{{ deleteRecordError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="deleteRecordLoading" @click="showDeleteRecordDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" prepend-icon="mdi-delete" :loading="deleteRecordLoading" @click="submitDeleteRecord">Delete Permanently</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Delete Vehicle Confirm Dialog ────────────────────────────────────── -->
  <v-dialog v-model="showDeleteVehicleDialog" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2 text-error">
        <v-icon icon="mdi-car-off" />
        Delete Vehicle
      </v-card-title>
      <v-card-text>
        <p>Delete vehicle <strong>{{ deleteVehicleTarget?.code }}</strong>?</p>
        <p class="text-medium-emphasis">{{ deleteVehicleTarget?.displayName || deleteVehicleTarget?.name }}</p>
        <p class="text-medium-emphasis text-caption mt-2">This action cannot be undone.</p>
        <v-alert v-if="deleteVehicleError" type="error" variant="tonal" density="compact" class="mt-3">{{ deleteVehicleError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="deleteVehicleLoading" @click="showDeleteVehicleDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" prepend-icon="mdi-delete" :loading="deleteVehicleLoading" @click="submitDeleteVehicle">Delete Permanently</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Delete Equipment Confirm Dialog ───────────────────────────────────── -->
  <v-dialog v-model="showDeleteEquipmentDialog" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2 text-error">
        <v-icon icon="mdi-toolbox-outline" />
        Delete Equipment
      </v-card-title>
      <v-card-text>
        <p>Delete equipment <strong>{{ deleteEquipmentTarget?.code }}</strong>?</p>
        <p class="text-medium-emphasis">{{ deleteEquipmentTarget?.displayName || deleteEquipmentTarget?.name }}</p>
        <p class="text-medium-emphasis text-caption mt-2">This action cannot be undone.</p>
        <v-alert v-if="deleteEquipmentError" type="error" variant="tonal" density="compact" class="mt-3">{{ deleteEquipmentError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="deleteEquipmentLoading" @click="showDeleteEquipmentDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" prepend-icon="mdi-delete" :loading="deleteEquipmentLoading" @click="submitDeleteEquipment">Delete Permanently</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Create Company Dialog ───────────────────────────────────────────── -->
  <v-dialog v-model="showCreateCompanyDialog" max-width="380" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon icon="mdi-domain-plus" />
        Create Company
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="createCompanyForm.name"
          label="Company Name"
          prepend-inner-icon="mdi-domain"
          variant="outlined"
          density="comfortable"
        />
        <v-alert v-if="createCompanyError" type="error" variant="tonal" density="compact" class="mt-2">{{ createCompanyError }}</v-alert>
        <v-alert v-if="createCompanySuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ createCompanySuccess }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="createCompanyLoading" @click="showCreateCompanyDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-domain-plus" :loading="createCompanyLoading" @click="submitCreateCompany">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'
import type { AppUser, Company } from '~/composables/useAuth'

const { currentUser, isAdmin, isClientAdmin, getAvailableModules, initAuth, logout, users, loadUsers, createUser, updateUser, deleteUser, companies, loadCompanies, createCompany, linkUserToCompany, unlinkUserFromCompany, authToken, loadUserModules, updateUserModules } = useAuth()
const { goBack } = useAppNavigation()
const { records: managementRecords, loadRecords, addRecord, updateRecord, deleteRecord, getRecordsByCompany: getRecordsByCompanyFn } = useRecords()
const getRecords = () => managementRecords.value
const { getChecklistTemplate, setChecklistTemplate, getEntriesByRecordCode } = useScheduleTracking()
const { connect, disconnect } = useSocket()

// Module permissions state
const userModules = ref<string[]>([])
const loadingModules = ref(false)
const moduleOptions = [
  { title: 'Vehicle Module', value: 'vehicle', icon: 'mdi-car', description: 'Track vehicles and service history' },
  { title: 'Equipment Module', value: 'equipment', icon: 'mdi-toolbox', description: 'Manage equipment inventory' },
  { title: 'Cleaning Module', value: 'cleaning', icon: 'mdi-spray-bottle', description: 'Monitor cleaning schedules' },
  { title: 'QR Codes Module', value: 'qr-codes', icon: 'mdi-qrcode', description: 'Generate and manage QR codes' },
  { title: 'Clients Module', value: 'clients', icon: 'mdi-account-tie', description: 'Manage client information' },
  { title: 'HR Module', value: 'hr', icon: 'mdi-account-group', description: 'Manage staff records' }
]

const assignableModuleOptions = computed(() => {
  if (isAdmin.value) {
    return moduleOptions
  }

  const allowed = new Set((getAvailableModules.value || []).filter(m => m !== 'qr-codes'))
  return moduleOptions.filter(option => allowed.has(option.value))
})

const loadModulesForUser = async (userId: number) => {
  loadingModules.value = true
  try {
    const result = await $fetch<{ modules: string[] }>(`/api/users/${userId}/modules`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    userModules.value = result.modules || []
  } catch (error) {
    console.error('Failed to load user modules:', error)
    userModules.value = []
  } finally {
    loadingModules.value = false
  }
}

const saveModulesForUser = async (userId: number, modules: string[]) => {
  try {
    await $fetch(`/api/users/${userId}/modules`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: { modules }
    })
    return { ok: true, message: 'Module permissions updated successfully.' }
  } catch (error: any) {
    console.error('Failed to save user modules:', error)
    return { ok: false, message: error?.data?.message || 'Failed to update module permissions.' }
  }
}

const saveUserModules = async () => {
  if (!selectedUserId.value) return
  loadingModules.value = true
  try {
    const result = await saveModulesForUser(selectedUserId.value, userModules.value)
    if (result.ok) {
      // Show success message
      console.log(result.message)
    }
  } finally {
    loadingModules.value = false
  }
}

// Load vehicles and equipment
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

const deleteVehicle = async (id: number) => {
  if (!authToken.value) throw new Error('Not authenticated')
  await $fetch(`/api/vehicles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken.value}` }
  })
  vehicles.value = vehicles.value.filter(v => v.id !== id)
}

const deleteEquipment = async (id: number) => {
  if (!authToken.value) throw new Error('Not authenticated')
  await $fetch(`/api/equipment/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken.value}` }
  })
  equipment.value = equipment.value.filter(e => e.id !== id)
}

// ── Live request notifications ────────────────────────────────────────────────
const liveRequestSnack = ref(false)
const liveRequestMsg = ref('')
const liveRequestCount = ref(0)

const userSearch = ref('')
const companySearch = ref('')
const recordSearch = ref('')
const siteFilter = ref('all')
const directoryTab = ref<'users' | 'companies'>('users')
const selectedUserId = ref<number | null>(null)
const selectedCompanyId = ref<number | null>(null)
const addUserToCompanyId = ref<number | null>(null)
const checklistItemsByCode = ref<Record<string, string[]>>({})
const newTaskByCode = ref<Record<string, string>>({})

// ── Create QR Code ───────────────────────────────────────────────────────────
const showCreateQrDialog = ref(false)
const createQrTarget = ref<{ type: 'user' | 'company'; id: number | null }>({ type: 'user', id: null })
const createQrForm = reactive({ name: '', location: '' })
const createQrError = ref('')
const createQrSuccess = ref('')

const getRecordsByCompany = (companyId: number) => {
  const recordItems = getRecordsByCompanyFn(companyId).map(r => ({
    ...r,
    itemType: 'record' as const,
    displayName: r.name,
    displayLocation: r.location
  }))

  const vehicleItems = vehicles.value
    .filter(v => v.owner_company_id === companyId)
    .map(v => ({
      id: v.id,
      code: v.code,
      name: `${v.make} ${v.model} (${v.year})`,
      location: v.registration_number || '',
      type: 'Vehicle',
      itemType: 'vehicle' as const,
      displayName: `${v.make} ${v.model} (${v.year})`,
      displayLocation: v.registration_number || ''
    }))

  const equipmentItems = equipment.value
    .filter(e => e.owner_company_id === companyId)
    .map(e => ({
      id: e.id,
      code: e.code,
      name: e.name,
      location: e.location || '',
      type: e.category || 'Equipment',
      itemType: 'equipment' as const,
      displayName: e.name,
      displayLocation: e.location || ''
    }))

  return [...recordItems, ...vehicleItems, ...equipmentItems]
}

const getCompanyNameById = (companyId: number) => {
  const company = companies.value.find((c: Company) => c.id === companyId)
  return company ? company.name : `Company #${companyId}`
}

const openCreateQrForUser = (userId: number) => {
  createQrTarget.value = { type: 'user', id: userId }
  createQrForm.name = ''
  createQrForm.location = ''
  createQrError.value = ''
  createQrSuccess.value = ''
  showCreateQrDialog.value = true
}

const openCreateQrForCompany = (companyId: number) => {
  createQrTarget.value = { type: 'company', id: companyId }
  createQrForm.name = ''
  createQrForm.location = ''
  createQrError.value = ''
  createQrSuccess.value = ''
  showCreateQrDialog.value = true
}

const submitCreateQrCode = async () => {
  createQrError.value = ''
  createQrSuccess.value = ''

  const name = createQrForm.name.trim()
  const location = createQrForm.location.trim()

  if (!name) {
    createQrError.value = 'Please enter a name for the QR code.'
    return
  }

  if (!location) {
    createQrError.value = 'Please enter a location or room.'
    return
  }

  const rec = await addRecord({
    name,
    location,
    description: '',
    type: 'Cleaning Station',
    ownerUserId: createQrTarget.value.type === 'user' ? createQrTarget.value.id : null,
    ownerCompanyId: createQrTarget.value.type === 'company' ? createQrTarget.value.id : null
  })

  createQrSuccess.value = `QR Code created: ${rec.code}`
  createQrForm.name = ''
  createQrForm.location = ''

  setTimeout(() => {
    showCreateQrDialog.value = false
    createQrSuccess.value = ''
  }, 1800)
}

// ── Create User ──────────────────────────────────────────────────────────────
const showCreateUserDialog = ref(false)
const createUserForm = reactive({ 
  name: '', 
  username: '', 
  password: '', 
  role: 'user' as 'user' | 'admin' | 'staff' | 'cleaner' | 'uv-hero' | 'client_admin' | 'client_technician',
  companyId: null as number | null,
  modules: [] as string[]
})
const createUserError = ref('')
const createUserSuccess = ref('')
const createUserLoading = ref(false)

const roleOptions = [
  { title: 'User', value: 'user' },
  { title: 'Staff', value: 'staff' },
  { title: 'Cleaner', value: 'cleaner' },
  { title: 'UV Hero', value: 'uv-hero' },
  { title: 'Client Admin', value: 'client_admin' },
  { title: 'Client Technician', value: 'client_technician' },
  { title: 'Admin', value: 'admin' }
]
const roleOptionsForClientAdmin = roleOptions.filter(option =>
  option.value === 'staff' || option.value === 'client_technician'
)

const isClientRole = (role: string) => {
  return role === 'client_admin' || role === 'client_technician'
}

const submitCreateUser = async () => {
  createUserError.value = ''
  createUserSuccess.value = ''
  
  // Validate client roles have a company (admin flow)
  if (isAdmin.value && isClientRole(createUserForm.role) && !createUserForm.companyId) {
    createUserError.value = 'Client Admin and Client Technician roles must be assigned to a company.'
    return
  }
  
  // Client admin must provide company ID
  if (isClientAdmin.value && !createUserForm.companyId) {
    createUserError.value = 'Company is required.'
    return
  }
  
  createUserLoading.value = true
  try {
    // Create user with companyId
    const response = await $fetch<{ id: number; name: string; username: string; role: string }>('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        name: createUserForm.name,
        username: createUserForm.username,
        password: createUserForm.password,
        role: createUserForm.role,
        companyId: createUserForm.companyId
      }
    })
    
    // Save module permissions if any were selected
    if (createUserForm.modules.length > 0 && response.id) {
      await saveModulesForUser(response.id, createUserForm.modules)
    }
    
    // Reload users list
    await loadUsers()
    
    createUserSuccess.value = `User "${response.name}" created successfully.`
    createUserForm.name = ''
    createUserForm.username = ''
    createUserForm.password = ''
    createUserForm.role = 'user'
    createUserForm.companyId = null
    createUserForm.modules = []
    setTimeout(() => {
      showCreateUserDialog.value = false
      createUserSuccess.value = ''
    }, 1500)
  } catch (error: any) {
    createUserError.value = error?.data?.message || error?.message || 'Failed to create user.'
  } finally {
    createUserLoading.value = false
  }
}

// ── Edit User ─────────────────────────────────────────────────────────────────
const showEditUserDialog = ref(false)
const editUserTarget = ref<AppUser | null>(null)
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
const editUserError = ref('')
const editUserSuccess = ref('')
const editUserLoading = ref(false)

const openEditUser = async (user: AppUser) => {
  editUserTarget.value = user
  editUserForm.name        = user.name
  editUserForm.username    = user.username
  editUserForm.displayName = user.profile?.displayName || user.name
  editUserForm.phone       = user.profile?.phone       || ''
  editUserForm.location    = user.profile?.location    || ''
  editUserForm.bio         = user.profile?.bio         || ''
  editUserForm.role        = user.role
  editUserForm.newPassword = ''
  editUserError.value      = ''
  editUserSuccess.value    = ''
  
  // Load user's module permissions
  if (isAdmin.value || isClientAdmin.value) {
    await loadModulesForUser(user.id)
    editUserForm.modules = [...userModules.value]
  }
  
  showEditUserDialog.value = true
}

const submitEditUser = async () => {
  if (!editUserTarget.value) return
  editUserError.value   = ''
  editUserSuccess.value = ''
  editUserLoading.value = true
  try {
    const payload: Parameters<typeof updateUser>[1] = {
      name:        editUserForm.name.trim()        || undefined,
      username:    editUserForm.username.trim()    || undefined,
      displayName: editUserForm.displayName.trim() || undefined,
      phone:       editUserForm.phone.trim(),
      location:    editUserForm.location.trim(),
      bio:         editUserForm.bio.trim(),
      role:        editUserForm.role
    }
    if (editUserForm.newPassword.trim()) {
      payload.newPassword = editUserForm.newPassword
    }
    const result = await updateUser(editUserTarget.value.id, payload)
    if (!result.ok) {
      editUserError.value = result.message
      return
    }
    
    // Save module permissions if admin and modules were changed
    if (isAdmin.value || isClientAdmin.value) {
      await saveModulesForUser(editUserTarget.value.id, editUserForm.modules)
    }
    
    editUserSuccess.value = result.message
    setTimeout(() => {
      showEditUserDialog.value = false
      editUserSuccess.value    = ''
    }, 1200)
  } finally {
    editUserLoading.value = false
  }
}

// ── Delete User ───────────────────────────────────────────────────────────────
const showDeleteUserDialog = ref(false)
const deleteUserTarget = ref<AppUser | null>(null)
const deleteUserError = ref('')
const deleteUserLoading = ref(false)

const openDeleteUser = (user: AppUser) => {
  deleteUserTarget.value  = user
  deleteUserError.value   = ''
  showDeleteUserDialog.value = true
}

const submitDeleteUser = async () => {
  if (!deleteUserTarget.value) return
  deleteUserError.value   = ''
  deleteUserLoading.value = true
  try {
    const result = await deleteUser(deleteUserTarget.value.id)
    if (!result.ok) {
      deleteUserError.value = result.message
      return
    }
    showDeleteUserDialog.value = false
    selectedUserId.value = null
  } finally {
    deleteUserLoading.value = false
  }
}

// ── Edit QR Record ────────────────────────────────────────────────────────────
import type { Record as QrRecord } from '~/composables/useRecords'

const showEditRecordDialog  = ref(false)
const editRecordTarget      = ref<QrRecord | null>(null)
const editRecordForm        = reactive({ name: '', type: '', location: '', description: '' })
const editRecordError       = ref('')
const editRecordSuccess     = ref('')
const editRecordLoading     = ref(false)

const openEditRecord = (rec: QrRecord) => {
  editRecordTarget.value       = rec
  editRecordForm.name          = rec.name
  editRecordForm.type          = rec.type
  editRecordForm.location      = rec.location
  editRecordForm.description   = rec.description
  editRecordError.value        = ''
  editRecordSuccess.value      = ''
  showEditRecordDialog.value   = true
}

const submitEditRecord = async () => {
  if (!editRecordTarget.value) return
  editRecordError.value   = ''
  editRecordSuccess.value = ''
  editRecordLoading.value = true
  try {
    await updateRecord(editRecordTarget.value.id, {
      name:        editRecordForm.name.trim(),
      type:        editRecordForm.type.trim(),
      location:    editRecordForm.location.trim(),
      description: editRecordForm.description.trim()
    })
    editRecordSuccess.value = 'QR code updated.'
    setTimeout(() => {
      showEditRecordDialog.value = false
      editRecordSuccess.value    = ''
    }, 1000)
  } catch {
    editRecordError.value = 'Update failed.'
  } finally {
    editRecordLoading.value = false
  }
}

// ── Delete QR Record ──────────────────────────────────────────────────────────
const showDeleteRecordDialog = ref(false)
const deleteRecordTarget     = ref<QrRecord | null>(null)
const deleteRecordError      = ref('')
const deleteRecordLoading    = ref(false)

const openDeleteRecord = (rec: QrRecord) => {
  deleteRecordTarget.value     = rec
  deleteRecordError.value      = ''
  showDeleteRecordDialog.value = true
}

const submitDeleteRecord = async () => {
  if (!deleteRecordTarget.value) return
  deleteRecordError.value   = ''
  deleteRecordLoading.value = true
  try {
    await deleteRecord(deleteRecordTarget.value.id)
    showDeleteRecordDialog.value = false
    deleteRecordTarget.value     = null
  } catch {
    deleteRecordError.value = 'Delete failed.'
  } finally {
    deleteRecordLoading.value = false
  }
}

// ── Delete Vehicle ────────────────────────────────────────────────────────────
const showDeleteVehicleDialog = ref(false)
const deleteVehicleTarget     = ref<any>(null)
const deleteVehicleError      = ref('')
const deleteVehicleLoading    = ref(false)

const openDeleteVehicle = (vehicle: any) => {
  deleteVehicleTarget.value     = vehicle
  deleteVehicleError.value      = ''
  showDeleteVehicleDialog.value = true
}

const submitDeleteVehicle = async () => {
  if (!deleteVehicleTarget.value) return
  deleteVehicleError.value   = ''
  deleteVehicleLoading.value = true
  try {
    await deleteVehicle(deleteVehicleTarget.value.id)
    showDeleteVehicleDialog.value = false
    deleteVehicleTarget.value     = null
  } catch (error: any) {
    console.error('Delete vehicle error:', error)
    deleteVehicleError.value = error?.data?.message || error?.message || 'Delete failed.'
  } finally {
    deleteVehicleLoading.value = false
  }
}

// ── Delete Equipment ──────────────────────────────────────────────────────────
const showDeleteEquipmentDialog = ref(false)
const deleteEquipmentTarget     = ref<any>(null)
const deleteEquipmentError      = ref('')
const deleteEquipmentLoading    = ref(false)

const openDeleteEquipment = (equip: any) => {
  deleteEquipmentTarget.value     = equip
  deleteEquipmentError.value      = ''
  showDeleteEquipmentDialog.value = true
}

const submitDeleteEquipment = async () => {
  if (!deleteEquipmentTarget.value) return
  deleteEquipmentError.value   = ''
  deleteEquipmentLoading.value = true
  try {
    await deleteEquipment(deleteEquipmentTarget.value.id)
    showDeleteEquipmentDialog.value = false
    deleteEquipmentTarget.value     = null
  } catch (error: any) {
    console.error('Delete equipment error:', error)
    deleteEquipmentError.value = error?.data?.message || error?.message || 'Delete failed.'
  } finally {
    deleteEquipmentLoading.value = false
  }
}

// ── Companies ─────────────────────────────────────────────────────────────────
const showCreateCompanyDialog = ref(false)
const createCompanyForm = reactive({ name: '' })
const createCompanyError = ref('')
const createCompanySuccess = ref('')
const createCompanyLoading = ref(false)

const submitCreateCompany = async () => {
  createCompanyError.value = ''
  createCompanySuccess.value = ''
  createCompanyLoading.value = true
  try {
    const result = await createCompany(createCompanyForm.name)
    if (!result.ok) {
      createCompanyError.value = result.message
      return
    }
    createCompanySuccess.value = result.message
    createCompanyForm.name = ''
    setTimeout(() => {
      showCreateCompanyDialog.value = false
      createCompanySuccess.value = ''
    }, 1500)
  } finally {
    createCompanyLoading.value = false
  }
}

const usersForCompanySelect = computed((): { title: string; value: number }[] =>
  users.value.map((u: AppUser) => ({ title: u.profile?.displayName || u.name, value: u.id }))
)

const companySelectItems = computed(() => [
  { title: 'No company', value: null },
  ...companies.value.map((c: Company) => ({ title: c.name, value: c.id }))
])

const filteredCompanies = computed(() => {
  const term = companySearch.value.trim().toLowerCase()
  if (!term) { return companies.value }
  return companies.value.filter((c: Company) => c.name.toLowerCase().includes(term))
})

const selectedCompany = computed(() => {
  if (!selectedCompanyId.value) { return filteredCompanies.value[0] || null }
  return filteredCompanies.value.find((c: Company) => c.id === selectedCompanyId.value) || filteredCompanies.value[0] || null
})

const getUserCompany = (userId: number) => {
  return companies.value.find((c: Company) => c.linkedUserIds.includes(userId)) || null
}

const getUserCompanyId = (userId: number) => {
  return getUserCompany(userId)?.id ?? null
}

const assignUserToCompany = (userId: number, companyId: number | null) => {
  // Remove from all companies first
  companies.value.forEach((c: Company) => {
    if (c.linkedUserIds.includes(userId)) {
      unlinkUserFromCompany(c.id, userId)
    }
  })
  // Then add to the new one if set
  if (companyId) {
    linkUserToCompany(companyId, userId)
  }
}

const unlinkdUsersForCompany = (companyId: number) => {
  const company = companies.value.find((c: Company) => c.id === companyId)
  return users.value
    .filter((u: AppUser) => !company?.linkedUserIds.includes(u.id))
    .map((u: AppUser) => ({ title: u.profile?.displayName || u.name, value: u.id }))
}

const selectUser = (userId: number) => {
  selectedUserId.value = userId
  siteFilter.value = 'all'
  recordSearch.value = ''
  // Load module permissions for this user
  loadModulesForUser(userId)
}

const selectCompany = (companyId: number) => {
  selectedCompanyId.value = companyId
  addUserToCompanyId.value = null
}

const setCompanyUsers = (companyId: number, rawIds: unknown) => {
  const selectedIds = (Array.isArray(rawIds) ? rawIds : []) as number[]
  const company = companies.value.find((c: Company) => c.id === companyId)
  if (!company) { return }
  selectedIds.filter((id: number) => !company.linkedUserIds.includes(id)).forEach((id: number) => linkUserToCompany(companyId, id))
  company.linkedUserIds.filter((id: number) => !selectedIds.includes(id)).forEach((id: number) => unlinkUserFromCompany(companyId, id))
}

const getUserNameById = (userId: number) => {
  const user = users.value.find((u: AppUser) => u.id === userId)
  return user ? (user.profile?.displayName || user.name) : `User #${userId}`
}

const allRecords = computed(() => getRecords())

const filteredUsers = computed(() => {
  const term = userSearch.value.trim().toLowerCase()

  if (!term) {
    return users.value
  }

  return users.value.filter(user => {
    return [
      user.name,
      user.username,
      user.role,
      user.profile?.displayName || '',
      user.profile?.location || ''
    ].some(value => value.toLowerCase().includes(term))
  })
})

const selectedUser = computed(() => {
  if (!selectedUserId.value) {
    return filteredUsers.value[0] || null
  }

  return filteredUsers.value.find(user => user.id === selectedUserId.value) || filteredUsers.value[0] || null
})

const recordsForSelectedUser = computed(() => {
  if (!selectedUser.value) {
    return []
  }

  const userId = selectedUser.value.id

  // Combine records, vehicles, and equipment into a unified list
  const recordItems = managementRecords.value
    .filter(r => r.ownerUserId === userId)
    .map(r => ({
      ...r,
      itemType: 'record' as const,
      displayName: r.name,
      displayLocation: r.location
    }))

  const vehicleItems = vehicles.value
    .filter(v => v.owner_user_id === userId)
    .map(v => ({
      id: v.id,
      code: v.code,
      name: `${v.make} ${v.model} (${v.year})`,
      location: v.registration_number || '',
      type: 'Vehicle',
      ownerUserId: v.owner_user_id,
      ownerCompanyId: v.owner_company_id,
      itemType: 'vehicle' as const,
      displayName: `${v.make} ${v.model} (${v.year})`,
      displayLocation: v.registration_number || ''
    }))

  const equipmentItems = equipment.value
    .filter(e => e.owner_user_id === userId)
    .map(e => ({
      id: e.id,
      code: e.code,
      name: e.name,
      location: e.location || '',
      type: e.category || 'Equipment',
      ownerUserId: e.owner_user_id,
      ownerCompanyId: e.owner_company_id,
      itemType: 'equipment' as const,
      displayName: e.name,
      displayLocation: e.location || ''
    }))

  return [...recordItems, ...vehicleItems, ...equipmentItems]
})

const siteOptions = computed(() => {
  const options = new Set(recordsForSelectedUser.value.map(item => item.displayLocation || item.location))
  return [...options].filter(Boolean).sort((a, b) => a.localeCompare(b))
})

const siteFilterItems = computed(() => {
  return [
    { label: 'All sites', value: 'all' },
    ...siteOptions.value.map(site => ({ label: site, value: site }))
  ]
})

const filteredUserRecords = computed(() => {
  const term = recordSearch.value.trim().toLowerCase()

  return recordsForSelectedUser.value.filter(item => {
    const locationToMatch = item.displayLocation || item.location
    const siteMatch = siteFilter.value === 'all' || locationToMatch === siteFilter.value

    if (!siteMatch) {
      return false
    }

    if (!term) {
      return true
    }

    return [item.code, item.displayName || item.name, item.type, locationToMatch]
      .some(value => value?.toLowerCase().includes(term))
  })
})

const seedChecklistItems = async (recordCode: string) => {
  if (checklistItemsByCode.value[recordCode] !== undefined) {
    return
  }

  const template = await getChecklistTemplate(recordCode)
  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: [...template.tasks]
  }

  newTaskByCode.value = {
    ...newTaskByCode.value,
    [recordCode]: ''
  }
}

const getChecklistItems = (recordCode: string) => {
  seedChecklistItems(recordCode)
  return checklistItemsByCode.value[recordCode] || []
}

const updateChecklistTask = (recordCode: string, index: number, value: string) => {
  const current = [...getChecklistItems(recordCode)]
  current[index] = value

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: current
  }
}

const removeChecklistTask = (recordCode: string, index: number) => {
  const current = [...getChecklistItems(recordCode)]
  current.splice(index, 1)

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: current
  }
}

const addChecklistTask = (recordCode: string) => {
  const nextTask = (newTaskByCode.value[recordCode] || '').trim()

  if (!nextTask) {
    return
  }

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: [...getChecklistItems(recordCode), nextTask]
  }

  newTaskByCode.value = {
    ...newTaskByCode.value,
    [recordCode]: ''
  }
}

const saveChecklistForRecord = async (recordCode: string) => {
  const tasks = getChecklistItems(recordCode)
    .map(task => task.trim())
    .filter(task => Boolean(task))

  setChecklistTemplate(recordCode, tasks, currentUser.value?.name || 'Admin')

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: [...(await getChecklistTemplate(recordCode)).tasks]
  }
}

const getRecentEntries = (recordCode: string) => {
  return getEntriesByRecordCode(recordCode).slice(0, 3)
}

const statusColor = (status: string) => {
  if (status === 'Done') {
    return 'success'
  }

  if (status === 'Incomplete') {
    return 'warning'
  }

  return 'error'
}

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })
}

const getRecordCountForUser = (user: (typeof users.value)[number]) => {
  const recordCount = managementRecords.value.filter(r => r.ownerUserId === user.id).length
  const vehicleCount = vehicles.value.filter(v => v.owner_user_id === user.id).length
  const equipmentCount = equipment.value.filter(e => e.owner_user_id === user.id).length
  return recordCount + vehicleCount + equipmentCount
}

const roleColor = (role: string) => {
  if (role === 'admin') { return 'error' }
  if (role === 'staff') { return 'warning' }
  if (role === 'cleaner') { return 'teal' }
  if (role === 'uv-hero') { return 'purple' }
  if (role === 'client_admin') { return 'green' }
  if (role === 'client_technician') { return 'cyan' }
  return 'primary'
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

watch(filteredCompanies, (nextCompanies) => {
  if (nextCompanies.length === 0) {
    selectedCompanyId.value = null
    return
  }

  if (!nextCompanies.some((c: Company) => c.id === selectedCompanyId.value)) {
    selectedCompanyId.value = nextCompanies[0].id
  }
}, { immediate: true })

watch(selectedUserId, () => {
  siteFilter.value = 'all'
  recordSearch.value = ''
})

watch(filteredUserRecords, (items) => {
  items.filter(item => item.itemType === 'record').forEach(record => seedChecklistItems(record.code))
}, { immediate: true })

onMounted(async () => {
  await initAuth()
  await Promise.all([loadRecords(), loadVehicles(), loadEquipment(), loadUsers(), loadCompanies()])

  if (!currentUser.value || !isAdmin.value) {
    navigateTo('/')
    return
  }

  // Connect and listen for incoming service requests.
  const socket = connect()
  socket.on('new-service-request', (req: { requestType: string; requestedBy: string }) => {
    liveRequestCount.value++
    const icon = req.requestType === 'maintenance' ? '🔧' : req.requestType === 'satisfaction' ? '⭐' : '🧹'
    const label = req.requestType === 'maintenance' ? 'Maintenance' : req.requestType === 'satisfaction' ? 'Satisfaction' : 'Cleaning'
    liveRequestMsg.value = `${icon} New ${label} request from ${req.requestedBy}`
    liveRequestSnack.value = true
  })
})

onUnmounted(() => {
  disconnect()
})

const toScanUrl = (record: { code: string; name: string; location: string }) => {
  const { siteUrl } = useRuntimeConfig().public
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  const origin = import.meta.client ? window.location.origin : siteUrl
  const params = new URLSearchParams({ name: record.name, location: record.location })
  return `${origin}${base}/scan/${record.code}?${params.toString()}`
}
</script>

<style scoped>
/* Hero */
.mgmt-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  min-height: 90px;
}

.mgmt-hero__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

/* Action cards */
.mgmt-action-card {
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1) !important;
  overflow: hidden;
}

.mgmt-action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.1) !important;
}

.mgmt-action-card__strip { height: 4px; }

.mgmt-action-card__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Directory list */
.directory-list {
  max-height: 480px;
  overflow-y: auto;
}

@media (max-width: 960px) {
  .mgmt-hero { padding: 18px 16px; }
  .mgmt-hero__icon { width: 42px; height: 42px; }
  .directory-list { max-height: 320px; }
}
</style>
