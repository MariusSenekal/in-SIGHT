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
                  @click="selectedModule = mod.value"
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
                      {{ selectedModule === mod.value ? 'Selected' : ' ' }}
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
              hint="Every record you import will belong to this account only."
              persistent-hint
              style="max-width: 480px;"
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
                    Download the {{ selectedModuleLabel }} CSV template and fill in one row per record.
                  </p>
                  <v-btn color="primary" variant="tonal" prepend-icon="mdi-download" @click="downloadTemplate">
                    Download Template
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
                    <p class="text-body-2 text-medium-emphasis mb-2">Drag & drop your CSV here, or</p>
                    <v-btn color="secondary" variant="tonal" prepend-icon="mdi-folder-open-outline" @click="triggerFilePicker">
                      Browse File
                    </v-btn>
                    <input ref="fileInputEl" type="file" accept=".csv,text/csv" class="d-none" @change="onFileSelected" />
                    <v-chip v-if="selectedFileName" class="mt-3" color="primary" variant="tonal" closable @click:close="clearFile">
                      <v-icon icon="mdi-file-delimited-outline" start size="16" />
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
                :disabled="!selectedFileText"
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
                <v-chip color="primary" variant="tonal">{{ preview.totalRows }} row(s) in file</v-chip>
                <v-chip color="success" variant="tonal">{{ preview.validCount }} ready to import</v-chip>
                <v-chip v-if="preview.errors.length" color="error" variant="tonal">{{ preview.errors.length }} will be skipped</v-chip>
              </div>

              <v-table v-if="preview.preview.length" density="compact" class="preview-table mb-4" fixed-header height="320">
                <thead>
                  <tr>
                    <th v-for="f in preview.fields" :key="f.key" class="text-left">{{ f.header }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in preview.preview" :key="idx">
                    <td v-for="f in preview.fields" :key="f.key">{{ row[f.key] || '—' }}</td>
                  </tr>
                </tbody>
              </v-table>
              <p v-if="preview.totalRows > preview.preview.length" class="text-caption text-medium-emphasis mb-4">
                Showing the first {{ preview.preview.length }} of {{ preview.totalRows }} rows.
              </p>

              <v-expansion-panels v-if="preview.errors.length" variant="accordion" class="mb-4">
                <v-expansion-panel>
                  <v-expansion-panel-title>{{ preview.errors.length }} row(s) will be skipped — why?</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div v-for="(err, idx) in preview.errors" :key="idx" class="text-body-2 mb-1">
                      Row {{ err.row }}: {{ err.message }}
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-alert v-if="preview.validCount === 0" type="warning" variant="tonal" density="compact" class="mb-4">
                No valid rows to import — fix the issues above and re-upload.
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
                    :disabled="preview.validCount === 0 || !!importResult"
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

const modules = [
  { value: 'clients', label: 'Clients', icon: 'mdi-account-tie', color1: '#3b82f6', color2: '#2563eb' },
  { value: 'staff', label: 'HR', icon: 'mdi-account-group', color1: '#8b5cf6', color2: '#7c3aed' },
  { value: 'vehicles', label: 'Vehicles', icon: 'mdi-car', color1: '#f97316', color2: '#ea580c' },
  { value: 'equipment', label: 'Equipment', icon: 'mdi-toolbox', color1: '#0e7490', color2: '#155e75' }
]

const stepTitles = ['Module & Recipient', 'Template & File', 'Preview & Confirm']

interface PreviewResult {
  totalRows: number
  validCount: number
  errors: Array<{ row: number; message: string }>
  preview: Array<Record<string, string>>
  fields: Array<{ key: string; header: string }>
}

const step = ref(1)
const selectedModule = ref('')
const targetUserId = ref<number | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const selectedFileText = ref('')
const isDragging = ref(false)
const loadError = ref('')
const previewLoading = ref(false)
const preview = ref<PreviewResult | null>(null)
const importing = ref(false)
const importResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const selectedModuleLabel = computed(() => modules.find(m => m.value === selectedModule.value)?.label || '')
const userOptions = computed(() =>
  users.value.map(u => ({ label: `${u.name} (${u.username}) — ${u.role}`, value: u.id }))
)
const selectedUserLabel = computed(() => userOptions.value.find(u => u.value === targetUserId.value)?.label || '')

const downloadTemplate = () => {
  const link = document.createElement('a')
  link.href = `/api/bulk-import/template?module=${selectedModule.value}`
  link.download = `${selectedModule.value}-template.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const triggerFilePicker = () => fileInputEl.value?.click()

const readFile = async (file: File) => {
  selectedFileName.value = file.name
  selectedFileText.value = await file.text()
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
  selectedFileText.value = ''
  if (fileInputEl.value) fileInputEl.value.value = ''
}

const runPreview = async () => {
  previewLoading.value = true
  loadError.value = ''
  importResult.value = null
  try {
    preview.value = await $fetch<PreviewResult>('/api/bulk-import/preview', {
      method: 'POST',
      body: { module: selectedModule.value, targetUserId: targetUserId.value, csv: selectedFileText.value }
    })
    step.value = 3
  } catch (error: any) {
    loadError.value = error?.data?.message || 'Could not read that file.'
  } finally {
    previewLoading.value = false
  }
}

const confirmImport = async () => {
  importing.value = true
  try {
    const result = await $fetch<{ inserted: number; errors: Array<{ row: number; message: string }> }>('/api/bulk-import/upload', {
      method: 'POST',
      body: { module: selectedModule.value, targetUserId: targetUserId.value, csv: selectedFileText.value }
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
  importResult.value = null
  loadError.value = ''
}

onMounted(async () => {
  await initAuth()
  await loadUsers()
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
</style>
