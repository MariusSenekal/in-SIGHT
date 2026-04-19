<template>
  <div class="container">

    <!-- Hero header -->
    <v-card rounded="xl" elevation="3" class="mb-5 overflow-hidden">
      <div class="mgmt-hero">
        <div class="d-flex align-center ga-3">
          <div class="mgmt-hero__icon">
            <v-icon icon="mdi-cog-outline" size="28" color="white" />
          </div>
          <div>
            <h1 class="text-h5 text-md-h4 font-weight-bold text-white">Management Tools</h1>
            <p class="text-caption text-white" style="opacity:0.8">Admin directory, QR records, checklists and service request management.</p>
          </div>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn color="white" variant="tonal" prepend-icon="mdi-arrow-left" size="small" @click="navigateTo('/')">Back</v-btn>
          <v-btn color="white" variant="outlined" prepend-icon="mdi-logout" size="small" @click="handleLogout">Log Out</v-btn>
        </div>
      </div>
    </v-card>

    <!-- Quick action cards -->
    <v-row dense class="mb-5">
      <v-col cols="12" sm="6" lg="3" v-for="item in quickActions" :key="item.to">
        <v-card :to="item.to" rounded="xl" elevation="2" class="mgmt-action-card cursor-pointer h-100">
          <div class="mgmt-action-card__strip" :style="`background: linear-gradient(90deg, ${item.color1} 0%, ${item.color2} 100%)`" />
          <v-card-text class="pa-4">
            <div class="d-flex align-center ga-3 mb-2">
              <div class="mgmt-action-card__icon" :style="`background: linear-gradient(135deg, ${item.color1} 0%, ${item.color2} 100%)`">
                <v-icon :icon="item.icon" color="white" size="20" />
              </div>
              <h3 class="text-subtitle-2 font-weight-bold">{{ item.title }}</h3>
            </div>
            <p class="text-body-2 text-medium-emphasis">{{ item.description }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
              <v-tab value="companies" prepend-icon="mdi-domain">
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
              <v-tabs-window-item value="companies">
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

              <v-row v-if="selectedUser.role === 'user' && filteredUserRecords.length > 0" dense>
                <v-col cols="12" v-for="record in filteredUserRecords" :key="record.id">
                  <v-card rounded="lg" variant="tonal" class="pa-2 pa-md-3">
                    <v-row>
                      <v-col cols="12" md="8">
                        <div class="d-flex flex-wrap align-center ga-2 mb-1">
                          <h3 class="text-h6 font-weight-bold">{{ record.name }}</h3>
                          <v-chip size="x-small" color="primary" variant="flat">{{ record.code }}</v-chip>
                          <v-chip size="x-small" color="info" variant="tonal">{{ record.type }}</v-chip>
                        </div>
                        <p class="text-medium-emphasis mb-3">Site / Room: {{ record.location }}</p>

                        <v-card variant="outlined" rounded="lg" class="mb-3">
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
                        <v-btn :to="`/scan/${record.code}`" color="primary" variant="flat" prepend-icon="mdi-open-in-new">
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
          <v-card v-else-if="directoryTab === 'companies' && selectedCompany" variant="outlined" rounded="lg">
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
                <v-col cols="12" sm="6" v-for="rec in getRecordsByCompany(selectedCompany.id)" :key="rec.id">
                  <v-card variant="tonal" rounded="lg" class="pa-3">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div>
                        <div class="font-weight-bold">{{ rec.name }}</div>
                        <div class="text-medium-emphasis text-caption">{{ rec.location }}</div>
                        <v-chip size="x-small" color="primary" variant="flat" class="mt-1">{{ rec.code }}</v-chip>
                      </div>
                      <QrcodeVue :value="toScanUrl(rec)" :size="80" level="H" render-as="svg" />
                    </div>
                    <v-btn :to="`/scan/${rec.code}`" size="small" color="primary" variant="tonal" prepend-icon="mdi-open-in-new" block>
                      Open Tracking Page
                    </v-btn>
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
  </div>

  <!-- ── Create User Dialog ──────────────────────────────────────────────── -->
  <v-dialog v-model="showCreateUserDialog" max-width="440" persistent>
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
          :items="roleOptions"
          item-title="title"
          item-value="value"
          label="Role"
          prepend-inner-icon="mdi-shield-account"
          variant="outlined"
          density="comfortable"
        />
        <v-alert v-if="createUserError" type="error" variant="tonal" density="compact" class="mt-2">{{ createUserError }}</v-alert>
        <v-alert v-if="createUserSuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ createUserSuccess }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showCreateUserDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-account-plus" @click="submitCreateUser">Create User</v-btn>
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
        <v-btn variant="text" @click="showCreateCompanyDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-domain-plus" @click="submitCreateCompany">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'
import type { AppUser, Company } from '~/composables/useAuth'

const { currentUser, isAdmin, initAuth, logout, users, createUser, companies, createCompany, linkUserToCompany, unlinkUserFromCompany } = useAuth()
const { goBack } = useAppNavigation()
const { getRecords, addRecord, getRecordsByCompany: getRecordsByCompanyFn } = useRecords()
const { getChecklistTemplate, setChecklistTemplate, getEntriesByRecordCode } = useScheduleTracking()

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
  return getRecordsByCompanyFn(companyId)
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

const submitCreateQrCode = () => {
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

  const rec = addRecord({
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
const createUserForm = reactive({ name: '', username: '', password: '', role: 'user' as 'user' | 'admin' | 'staff' })
const createUserError = ref('')
const createUserSuccess = ref('')

const roleOptions = [
  { title: 'User', value: 'user' },
  { title: 'Staff', value: 'staff' },
  { title: 'Admin', value: 'admin' }
]

const submitCreateUser = () => {
  createUserError.value = ''
  createUserSuccess.value = ''
  const result = createUser(createUserForm.name, createUserForm.username, createUserForm.password, createUserForm.role)
  if (!result.ok) {
    createUserError.value = result.message
    return
  }
  createUserSuccess.value = result.message
  createUserForm.name = ''
  createUserForm.username = ''
  createUserForm.password = ''
  createUserForm.role = 'user'
  setTimeout(() => {
    showCreateUserDialog.value = false
    createUserSuccess.value = ''
  }, 1500)
}

// ── Companies ─────────────────────────────────────────────────────────────────
const showCreateCompanyDialog = ref(false)
const createCompanyForm = reactive({ name: '' })
const createCompanyError = ref('')
const createCompanySuccess = ref('')

const submitCreateCompany = () => {
  createCompanyError.value = ''
  createCompanySuccess.value = ''
  const result = createCompany(createCompanyForm.name)
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

const quickActions = [
  {
    to: '/dashboard',
    title: 'Dashboard Home',
    description: 'Return to the admin dashboard overview.',
    icon: 'mdi-view-dashboard-outline',
    color1: 'rgb(var(--v-theme-primary))',
    color2: 'rgb(var(--v-theme-secondary))'
  },
  {
    to: '/records',
    title: 'Record Access',
    description: 'Manage records and identifiers.',
    icon: 'mdi-folder-multiple-outline',
    color1: '#0d9488',
    color2: '#0891b2'
  },
  {
    to: '/dashboard/qr-codes',
    title: 'QR Code Section',
    description: 'Generate printable QR pages.',
    icon: 'mdi-qrcode',
    color1: '#7c3aed',
    color2: '#6d28d9'
  },
  {
    to: '/dashboard/requests',
    title: 'Service Requests',
    description: 'Review and resolve requests.',
    icon: 'mdi-clipboard-list-outline',
    color1: '#ea580c',
    color2: '#c2410c'
  }
]

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
  if (!selectedUser.value || selectedUser.value.role !== 'user') {
    return []
  }

  return allRecords.value.filter(record => record.ownerUserId === selectedUser.value?.id)
})

const siteOptions = computed(() => {
  const options = new Set(recordsForSelectedUser.value.map(record => record.location))
  return [...options].sort((a, b) => a.localeCompare(b))
})

const siteFilterItems = computed(() => {
  return [
    { label: 'All sites', value: 'all' },
    ...siteOptions.value.map(site => ({ label: site, value: site }))
  ]
})

const filteredUserRecords = computed(() => {
  const term = recordSearch.value.trim().toLowerCase()

  return recordsForSelectedUser.value.filter(record => {
    const siteMatch = siteFilter.value === 'all' || record.location === siteFilter.value

    if (!siteMatch) {
      return false
    }

    if (!term) {
      return true
    }

    return [record.code, record.name, record.type, record.location]
      .some(value => value.toLowerCase().includes(term))
  })
})

const seedChecklistItems = (recordCode: string) => {
  if (checklistItemsByCode.value[recordCode] !== undefined) {
    return
  }

  const template = getChecklistTemplate(recordCode)
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

const saveChecklistForRecord = (recordCode: string) => {
  const tasks = getChecklistItems(recordCode)
    .map(task => task.trim())
    .filter(task => Boolean(task))

  setChecklistTemplate(recordCode, tasks, currentUser.value?.name || 'Admin')

  checklistItemsByCode.value = {
    ...checklistItemsByCode.value,
    [recordCode]: [...getChecklistTemplate(recordCode).tasks]
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
  if (user.role !== 'user') {
    return 0
  }

  return allRecords.value.filter(record => record.ownerUserId === user.id).length
}

const roleColor = (role: string) => {
  if (role === 'admin') { return 'error' }
  if (role === 'staff') { return 'warning' }
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

watch(filteredUserRecords, (records) => {
  records.forEach(record => seedChecklistItems(record.code))
}, { immediate: true })

onMounted(() => {
  initAuth()

  if (!currentUser.value || !isAdmin.value) {
    navigateTo('/')
  }
})

const handleLogout = () => {
  logout()
  navigateTo('/')
}

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
