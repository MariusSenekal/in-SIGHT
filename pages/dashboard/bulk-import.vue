<template>
  <DashboardLayout>
    <v-card rounded="xl" elevation="2">
      <div class="card-accent-top" />
      <v-card-text class="pa-4 pa-sm-5">
        <div class="d-flex align-center ga-2 mb-1">
          <v-icon icon="mdi-file-upload-outline" color="primary" size="22" />
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold">Bulk Import</h2>
        </div>
        <p class="text-caption text-sm-body-2 text-medium-emphasis mb-5">
          Download a template, fill in one row per record, then preview exactly what will be created before
          anything is saved. This always creates <strong>brand-new</strong> records — it never changes existing ones.
        </p>

        <v-stepper v-model="step" :items="stepTitles" flat hide-actions>
          <!-- ─── Step 1: Module + recipient ─── -->
          <template #item.1>
            <p class="text-overline text-medium-emphasis mb-3">Which module?</p>
            <v-row dense class="mb-4">
              <v-col cols="6" sm="3" v-for="mod in modules" :key="mod.value">
                <v-card
                  rounded="lg"
                  :elevation="selectedModule === mod.value ? 4 : 1"
                  class="module-pick-card cursor-pointer"
                  :class="{ 'module-pick-card--active': selectedModule === mod.value }"
                  @click="selectModule(mod.value)"
                >
                  <v-icon
                    v-if="selectedModule === mod.value"
                    icon="mdi-check-circle"
                    color="success"
                    size="20"
                    class="module-pick-card__check"
                  />
                  <div class="module-pick-card__strip" :style="`background: linear-gradient(90deg, ${mod.color1} 0%, ${mod.color2} 100%)`" />
                  <v-card-text class="pa-3 text-center">
                    <div
                      class="module-pick-card__icon mx-auto mb-2"
                      :style="`background: linear-gradient(135deg, ${mod.color1} 0%, ${mod.color2} 100%)`"
                    >
                      <v-icon :icon="mod.icon" color="white" size="22" />
                    </div>
                    <div class="text-body-2 font-weight-bold">{{ mod.label }}</div>
                    <div class="text-caption mt-1" :class="selectedModule === mod.value ? 'text-success font-weight-bold' : 'text-medium-emphasis'">
                      {{ selectedModule === mod.value ? 'Selected' : ' ' }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <p class="text-overline text-medium-emphasis mb-2">Import records for which user/client?</p>
            <v-select
              v-model="targetUserId"
              :items="userOptions"
              item-title="label"
              item-value="value"
              label="Target user/client"
              prepend-inner-icon="mdi-account-outline"
              variant="outlined"
              density="comfortable"
              :disabled="!selectedModule"
              :hint="userSelectHint"
              persistent-hint
              style="max-width: 480px;"
              no-data-text="No users have access to this module yet — grant access first under Management Tools."
            />

            <div class="d-flex justify-end mt-5">
              <v-btn color="primary" variant="flat" :disabled="!selectedModule || !targetUserId" @click="step = 2">
                Next: Template & File
              </v-btn>
            </div>
          </template>

          <!-- ─── Step 2: Template + upload ─── -->
          <template #item.2>
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              Importing <strong>{{ selectedModuleLabel }}</strong> records for
              <strong>{{ selectedUserLabel }}</strong>.
              <v-btn variant="text" size="x-small" class="ml-1" @click="step = 1">Change</v-btn>
            </v-alert>

            <v-row dense>
              <v-col cols="12" sm="5">
                <v-card variant="outlined" rounded="lg" class="pa-4 h-100 d-flex flex-column">
                  <div class="text-subtitle-2 font-weight-bold mb-2">1. Get the template</div>
                  <p class="text-body-2 text-medium-emphasis mb-3">
                    Download the {{ selectedModuleLabel }} template and fill in one row per record.
                  </p>
                  <v-btn color="primary" variant="tonal" prepend-icon="mdi-microsoft-excel" class="mb-2" @click="downloadTemplate('xlsx')">
                    Download Excel Template
                  </v-btn>
                  <v-btn color="secondary" variant="text" prepend-icon="mdi-file-delimited-outline" @click="downloadTemplate('csv')">
                    Or download CSV instead
                  </v-btn>
                </v-card>
              </v-col>

              <v-col cols="12" sm="7">
                <v-card
                  variant="outlined"
                  rounded="lg"
                  class="pa-4 h-100 dropzone"
                  :class="{ 'dropzone--active': isDragging }"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="onDrop"
                >
                  <div class="text-subtitle-2 font-weight-bold mb-2">2. Upload your file</div>
                  <div class="d-flex flex-column align-center justify-center text-center flex-grow-1 py-4">
                    <v-icon icon="mdi-cloud-upload-outline" size="40" color="primary" class="mb-2" />
                    <p class="text-body-2 text-medium-emphasis mb-2">Drag & drop your Excel or CSV file here, or</p>
                    <v-btn color="secondary" variant="tonal" prepend-icon="mdi-folder-open-outline" @click="triggerFilePicker">
                      Browse File
                    </v-btn>
                    <input
                      ref="fileInputEl"
                      type="file"
                      accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      class="d-none"
                      @change="onFileSelected"
                    />
                    <v-chip v-if="selectedFileName" class="mt-3" color="primary" variant="tonal" closable @click:close="clearFile">
                      <v-icon :icon="selectedFileFormat === 'xlsx' ? 'mdi-microsoft-excel' : 'mdi-file-delimited-outline'" start size="16" />
                      {{ selectedFileName }}
                    </v-chip>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="mt-4">{{ loadError }}</v-alert>

            <div class="d-flex justify-space-between mt-5">
              <v-btn variant="text" @click="step = 1">Back</v-btn>
              <v-btn
                color="primary"
                variant="flat"
                :loading="previewLoading"
                :disabled="!selectedFilePayload"
                @click="runPreview"
              >
                Next: Preview
              </v-btn>
            </div>
          </template>

          <!-- ─── Step 3: Preview + confirm ─── -->
          <template #item.3>
            <div v-if="preview">
              <div class="d-flex flex-wrap ga-2 mb-4">
                <v-chip color="primary" variant="tonal">{{ editableRows.length }} row(s)</v-chip>
                <v-chip color="success" variant="tonal">{{ preview.validCount }} ready to import</v-chip>
                <v-chip v-if="preview.errors.length" color="error" variant="tonal">{{ preview.errors.length }} need fixing</v-chip>
              </div>

              <p class="text-body-2 text-medium-emphasis mb-3">
                Edit any cell directly, remove a row you don't need, or add a new one — then re-check before confirming.
              </p>

              <v-table v-if="editableRows.length" density="compact" class="preview-table mb-3" fixed-header height="380">
                <thead>
                  <tr>
                    <th v-for="f in preview.fields" :key="f.key" class="text-left" style="min-width: 160px;">
                      {{ f.header }}<span v-if="f.required" class="text-error">&nbsp;*</span>
                    </th>
                    <th class="text-center" style="width: 48px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in editableRows" :key="row.id" :class="{ 'preview-row--error': hasRowError(row) }">
                    <td v-for="f in preview.fields" :key="f.key" class="py-1">
                      <v-text-field
                        v-model="row.values[f.key]"
                        density="compact"
                        variant="outlined"
                        hide-details
                        single-line
                        :error="!!row.fieldErrors[f.key]"
                        :title="row.fieldErrors[f.key] || ''"
                        @update:model-value="dirty = true"
                      />
                    </td>
                    <td class="text-center">
                      <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeRow(row.id)" />
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <div class="d-flex justify-space-between align-center mb-4">
                <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" @click="addRow">Add Row</v-btn>
                <v-btn
                  variant="tonal"
                  size="small"
                  color="primary"
                  prepend-icon="mdi-refresh"
                  :loading="previewLoading"
                  @click="runRevalidate"
                >
                  Re-check
                </v-btn>
              </div>

              <v-expansion-panels v-if="preview.errors.length" variant="accordion" class="mb-4">
                <v-expansion-panel>
                  <v-expansion-panel-title>{{ preview.errors.length }} issue(s) found — why?</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div v-for="(err, idx) in preview.errors" :key="idx" class="text-body-2 mb-1">
                      Row {{ err.row }}: {{ err.message }}
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-alert v-if="dirty" type="info" variant="tonal" density="compact" class="mb-4">
                You've made changes — click <strong>Re-check</strong> to validate them before confirming.
              </v-alert>

              <v-alert v-else-if="preview.validCount === 0" type="warning" variant="tonal" density="compact" class="mb-4">
                No valid rows to import — fix the issues above.
              </v-alert>

              <v-alert v-if="importResult" :type="importResult.type" variant="tonal" density="compact" class="mb-4">
                {{ importResult.message }}
              </v-alert>

              <div class="d-flex justify-space-between">
                <v-btn variant="text" @click="step = 2">Back</v-btn>
                <div class="d-flex ga-2">
                  <v-btn variant="text" @click="reset">Start Over</v-btn>
                  <v-btn
                    color="success"
                    variant="flat"
                    prepend-icon="mdi-cloud-upload"
                    :loading="importing"
                    :disabled="dirty || preview.validCount === 0 || !!importResult"
                    @click="confirmImport"
                  >
                    Confirm Import ({{ preview.validCount }})
                  </v-btn>
                </div>
              </div>
            </div>
            <v-alert v-else type="info" variant="tonal" density="compact">
              Complete the previous steps first.
            </v-alert>
          </template>
        </v-stepper>
      </v-card-text>
    </v-card>
  </DashboardLayout>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const { users, loadUsers, initAuth } = useAuth()

// One card per bulk-import-capable module. `value` matches the key in
// server/utils/bulkImportSchemas.ts; `permission` matches the module name
// used by insight.user_module_permissions (see bulkImportPermissionModule
// on the server) so the picker below can filter by real access.
const modules = [
  { value: 'clients', permission: 'clients', label: 'Clients', icon: 'mdi-account-tie', color1: '#3b82f6', color2: '#2563eb' },
  { value: 'staff', permission: 'hr', label: 'HR', icon: 'mdi-account-group', color1: '#8b5cf6', color2: '#7c3aed' },
  { value: 'vehicles', permission: 'vehicle', label: 'Vehicles', icon: 'mdi-car', color1: '#f97316', color2: '#ea580c' },
  { value: 'equipment', permission: 'equipment', label: 'Equipment', icon: 'mdi-toolbox', color1: '#0e7490', color2: '#155e75' },
  { value: 'records', permission: 'cleaning', label: 'Cleaning / Compliance', icon: 'mdi-clipboard-check-outline', color1: '#0d9488', color2: '#0f766e' }
]

const stepTitles = ['Module & Recipient', 'Template & File', 'Preview & Confirm']

interface BulkFieldSpec {
  key: string
  header: string
  required?: boolean
  type?: 'number' | 'date' | 'boolean'
  example: string
}

interface PreviewRow {
  row: number
  values: Record<string, string>
  fieldErrors: Record<string, string>
}

interface PreviewResult {
  totalRows: number
  validCount: number
  errors: Array<{ row: number; message: string }>
  preview: PreviewRow[]
  fields: BulkFieldSpec[]
}

// A row in the editable grid - `id` is a client-only key (stable across
// edits/reorders) so v-for doesn't lose input focus; it's never sent back
// to the server, only `values` is.
interface EditableRow {
  id: number
  values: Record<string, string>
  fieldErrors: Record<string, string>
}

const step = ref(1)
const selectedModule = ref('')
const targetUserId = ref<number | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const selectedFileFormat = ref<'csv' | 'xlsx' | null>(null)
const selectedFilePayload = ref<{ format: 'csv' | 'xlsx'; content: string } | null>(null)
const isDragging = ref(false)
const loadError = ref('')
const previewLoading = ref(false)
const preview = ref<PreviewResult | null>(null)
const editableRows = ref<EditableRow[]>([])
const dirty = ref(false)
let nextRowId = 1
const importing = ref(false)
const importResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// userId -> list of module permission keys, e.g. { 12: ['vehicle', 'hr'] }
const userModulesById = ref<Record<number, string[]>>({})

const selectedModuleLabel = computed(() => modules.find(m => m.value === selectedModule.value)?.label || '')
const selectedModulePermission = computed(() => modules.find(m => m.value === selectedModule.value)?.permission || '')

// Mirrors useAuth().hasModuleAccess() per-candidate: admins see everyone,
// client_technicians implicitly have vehicle/equipment, everyone else is
// checked against their explicitly granted modules.
const userHasAccess = (userId: number, role: string, permission: string): boolean => {
  if (role === 'admin') return true
  if (role === 'client_technician' && (permission === 'vehicle' || permission === 'equipment')) return true
  return (userModulesById.value[userId] || []).includes(permission)
}

const userOptions = computed(() => {
  if (!selectedModulePermission.value) return []
  return users.value
    .filter(u => userHasAccess(u.id, u.role, selectedModulePermission.value))
    .map(u => ({ label: `${u.name} (${u.username}) — ${u.role}`, value: u.id }))
})
const selectedUserLabel = computed(() => userOptions.value.find(u => u.value === targetUserId.value)?.label || '')
const userSelectHint = computed(() =>
  selectedModule.value
    ? `Only users with access to ${selectedModuleLabel.value} are listed. Every record you import will belong to this account only.`
    : 'Pick a module first.'
)

const selectModule = (value: string) => {
  selectedModule.value = value
  // Switching modules can invalidate the previously-picked user (they might
  // not have access to the new module) - clear it rather than silently
  // importing to the wrong account.
  if (!userOptions.value.some(u => u.value === targetUserId.value)) {
    targetUserId.value = null
  }
}

const downloadTemplate = (format: 'xlsx' | 'csv') => {
  const link = document.createElement('a')
  link.href = `/api/bulk-import/template?module=${selectedModule.value}&format=${format}`
  link.download = `${selectedModule.value}-template.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const triggerFilePicker = () => fileInputEl.value?.click()

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

const readFile = async (file: File) => {
  const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.type.includes('spreadsheetml')
  selectedFileName.value = file.name
  if (isXlsx) {
    selectedFileFormat.value = 'xlsx'
    selectedFilePayload.value = { format: 'xlsx', content: arrayBufferToBase64(await file.arrayBuffer()) }
  } else {
    selectedFileFormat.value = 'csv'
    selectedFilePayload.value = { format: 'csv', content: await file.text() }
  }
  loadError.value = ''
}

const onFileSelected = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) await readFile(file)
}

const onDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) await readFile(file)
}

const clearFile = () => {
  selectedFileName.value = ''
  selectedFileFormat.value = null
  selectedFilePayload.value = null
  if (fileInputEl.value) fileInputEl.value.value = ''
}

const setFromPreviewResult = (result: PreviewResult) => {
  preview.value = result
  editableRows.value = result.preview.map((r) => ({
    id: nextRowId++,
    values: { ...r.values },
    fieldErrors: { ...r.fieldErrors }
  }))
  dirty.value = false
}

const hasRowError = (row: EditableRow) => Object.keys(row.fieldErrors).length > 0

const addRow = () => {
  if (!preview.value) return
  const values: Record<string, string> = {}
  preview.value.fields.forEach((f) => { values[f.key] = '' })
  editableRows.value.push({ id: nextRowId++, values, fieldErrors: {} })
  dirty.value = true
}

const removeRow = (id: number) => {
  editableRows.value = editableRows.value.filter((r) => r.id !== id)
  dirty.value = true
}

const rowsForServer = () => editableRows.value.map((r) => r.values)

const runPreview = async () => {
  if (!selectedFilePayload.value) return
  previewLoading.value = true
  loadError.value = ''
  importResult.value = null
  try {
    const result = await $fetch<PreviewResult>('/api/bulk-import/preview', {
      method: 'POST',
      body: { module: selectedModule.value, targetUserId: targetUserId.value, ...selectedFilePayload.value }
    })
    setFromPreviewResult(result)
    step.value = 3
  } catch (error: any) {
    loadError.value = error?.data?.message || 'Could not read that file.'
  } finally {
    previewLoading.value = false
  }
}

// Re-validates the admin's edited rows (after add/remove/edit) server-side,
// using the exact same rules the real import will apply, before letting
// them confirm.
const runRevalidate = async () => {
  previewLoading.value = true
  try {
    const result = await $fetch<PreviewResult>('/api/bulk-import/preview', {
      method: 'POST',
      body: { module: selectedModule.value, targetUserId: targetUserId.value, rows: rowsForServer() }
    })
    setFromPreviewResult(result)
  } catch (error: any) {
    loadError.value = error?.data?.message || 'Could not validate these rows.'
  } finally {
    previewLoading.value = false
  }
}

const confirmImport = async () => {
  importing.value = true
  try {
    const result = await $fetch<{ inserted: number; errors: Array<{ row: number; message: string }> }>('/api/bulk-import/upload', {
      method: 'POST',
      body: { module: selectedModule.value, targetUserId: targetUserId.value, rows: rowsForServer() }
    })
    importResult.value = {
      type: result.inserted > 0 ? 'success' : 'error',
      message: result.inserted > 0
        ? `Imported ${result.inserted} new ${selectedModuleLabel.value.toLowerCase()} record(s) for ${selectedUserLabel.value}.`
        : 'No records were imported.'
    }
  } catch (error: any) {
    importResult.value = { type: 'error', message: error?.data?.message || 'Import failed.' }
  } finally {
    importing.value = false
  }
}

const reset = () => {
  step.value = 1
  selectedModule.value = ''
  targetUserId.value = null
  clearFile()
  preview.value = null
  editableRows.value = []
  dirty.value = false
  importResult.value = null
  loadError.value = ''
}

onMounted(async () => {
  await initAuth()
  await loadUsers()
  try {
    userModulesById.value = await $fetch<Record<number, string[]>>('/api/users/modules-bulk')
  } catch {
    userModulesById.value = {}
  }
})
</script>

<style scoped>
.module-pick-card {
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
}
.module-pick-card:hover {
  transform: translateY(-2px);
}
.module-pick-card--active {
  border-color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.06);
}
.module-pick-card__check {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  background: white;
  border-radius: 50%;
}
.module-pick-card__strip {
  height: 4px;
}
.module-pick-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropzone {
  border-style: dashed !important;
  transition: background 0.15s, border-color 0.15s;
}
.dropzone--active {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgb(var(--v-theme-primary)) !important;
}

.preview-table {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
}
.preview-row--error {
  background: rgba(var(--v-theme-error), 0.06);
}
</style>
