<template>
  <div class="attachments-panel">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-paperclip" size="18" color="primary" />
        <span class="text-subtitle-2 font-weight-bold">Photos &amp; Documents</span>
        <v-chip size="x-small" variant="tonal" color="primary">{{ attachments.length }}</v-chip>
      </div>
      <div v-if="canEdit" class="d-flex align-center ga-2 flex-wrap">
        <v-select
          v-model="uploadPurpose"
          :items="purposeOptions"
          label="What is this for?"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 190px;"
        />
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-image-multiple-outline"
          :loading="uploading"
          @click="triggerPhotoPicker"
        >
          Add Photos
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-file-document-multiple-outline"
          :loading="uploading"
          @click="triggerDocumentPicker"
        >
          Add Documents
        </v-btn>
        <input
          ref="photoInputRef"
          type="file"
          accept="image/*"
          multiple
          class="d-none"
          @change="onFilesSelected"
        />
        <input
          ref="documentInputRef"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          class="d-none"
          @change="onFilesSelected"
        />
      </div>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-3" closable @click:close="errorMessage = ''">
      {{ errorMessage }}
    </v-alert>

    <div
      v-if="canEdit"
      class="attachments-dropzone mb-3"
      :class="{ 'attachments-dropzone--active': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPhotoPicker"
    >
      <v-icon icon="mdi-tray-arrow-up" size="22" color="primary" class="mb-1" />
      <div class="text-caption text-medium-emphasis">Drag &amp; drop any number of photos or documents here, or use the buttons above</div>
    </div>

    <div v-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate color="primary" size="28" />
    </div>

    <div v-else-if="!attachments.length" class="text-center py-4 text-medium-emphasis text-body-2">
      No photos or documents yet.
    </div>

    <v-row v-else dense>
      <v-col v-for="item in attachments" :key="item.id" cols="12" sm="6" md="4">
        <v-card variant="outlined" rounded="lg" class="attachment-card h-100">
          <v-card-text class="pa-3">
            <div class="d-flex align-center ga-2 mb-2">
              <div class="attachment-card__icon">
                <v-icon :icon="fileIcon(item.content_type)" size="20" color="primary" />
              </div>
              <div class="flex-grow-1 min-width-0">
                <div class="text-body-2 font-weight-bold text-truncate" :title="item.file_name">{{ item.file_name }}</div>
                <div class="text-caption text-medium-emphasis">{{ formatSize(item.size_bytes) }} &middot; {{ formatDate(item.created_at) }}</div>
              </div>
            </div>
            <v-chip size="x-small" variant="tonal" color="secondary" class="mb-2">{{ item.purpose }}</v-chip>
            <div class="d-flex ga-1">
              <v-btn size="x-small" variant="tonal" color="primary" icon="mdi-open-in-new" :loading="busyId === item.id && busyAction === 'view'" @click="openAttachment(item)" title="View" />
              <v-btn size="x-small" variant="tonal" color="secondary" icon="mdi-share-variant-outline" :loading="busyId === item.id && busyAction === 'share'" @click="shareAttachment(item)" title="Share" />
              <v-btn v-if="canEdit" size="x-small" variant="tonal" color="error" icon="mdi-delete-outline" :loading="busyId === item.id && busyAction === 'delete'" @click="confirmDelete(item)" title="Delete" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">{{ snackbar.text }}</v-snackbar>

    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2">Delete file?</v-card-title>
        <v-card-text class="px-5 pb-2">
          Remove "{{ deleteDialog.target?.file_name }}"? This cannot be undone.
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.show = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="performDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
interface Attachment {
  id: number
  file_name: string
  content_type: string
  size_bytes: number
  purpose: string
  created_at: string
}

const props = defineProps<{
  module: string
  recordId: number | null
  canEdit?: boolean
}>()

const canEdit = computed(() => props.canEdit ?? true)

const purposeOptions = [
  'ID Document',
  'Contract',
  'Certificate / Qualification',
  'Profile Photo',
  'Proof of Address',
  'Medical / Health',
  'Other'
]

const attachments = ref<Attachment[]>([])
const loading = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const uploadPurpose = ref('Other')
const isDragging = ref(false)
const photoInputRef = ref<HTMLInputElement | null>(null)
const documentInputRef = ref<HTMLInputElement | null>(null)
const busyId = ref<number | null>(null)
const busyAction = ref<'view' | 'share' | 'delete' | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const deleteDialog = ref<{ show: boolean; target: Attachment | null }>({ show: false, target: null })

const notify = (text: string, color: 'success' | 'error' = 'success') => {
  snackbar.value = { show: true, text, color }
}

const loadAttachments = async () => {
  if (!props.recordId) return
  loading.value = true
  errorMessage.value = ''
  try {
    attachments.value = await $fetch<Attachment[]>('/api/attachments', {
      query: { module: props.module, recordId: props.recordId }
    })
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Failed to load attachments.'
  } finally {
    loading.value = false
  }
}

watch(() => [props.module, props.recordId], loadAttachments, { immediate: true })

const triggerPhotoPicker = () => photoInputRef.value?.click()
const triggerDocumentPicker = () => documentInputRef.value?.click()

const uploadFiles = async (fileList: FileList | File[]) => {
  if (!props.recordId || !fileList.length) return
  uploading.value = true
  errorMessage.value = ''
  try {
    const formData = new FormData()
    formData.append('module', props.module)
    formData.append('recordId', String(props.recordId))
    formData.append('purpose', uploadPurpose.value)
    Array.from(fileList).forEach((file) => formData.append('files', file, file.name))

    await $fetch('/api/attachments/upload', { method: 'POST', body: formData })
    notify('Files uploaded.')
    await loadAttachments()
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

const onFilesSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.length) uploadFiles(input.files)
  input.value = ''
}

const onDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files)
}

const getSignedUrl = async (item: Attachment): Promise<string> => {
  const res = await $fetch<{ url: string }>(`/api/attachments/${item.id}/url`)
  return res.url
}

const openAttachment = async (item: Attachment) => {
  busyId.value = item.id
  busyAction.value = 'view'
  try {
    const url = await getSignedUrl(item)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (err: any) {
    notify(err?.data?.message || 'Could not open file.', 'error')
  } finally {
    busyId.value = null
    busyAction.value = null
  }
}

const shareAttachment = async (item: Attachment) => {
  busyId.value = item.id
  busyAction.value = 'share'
  try {
    const url = await getSignedUrl(item)
    if (navigator.share) {
      await navigator.share({ title: item.file_name, url })
    } else {
      await navigator.clipboard.writeText(url)
      notify('Link copied to clipboard.')
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      notify(err?.data?.message || 'Could not share file.', 'error')
    }
  } finally {
    busyId.value = null
    busyAction.value = null
  }
}

const confirmDelete = (item: Attachment) => {
  deleteDialog.value = { show: true, target: item }
}

const performDelete = async () => {
  const item = deleteDialog.value.target
  if (!item) return
  deleteDialog.value.show = false
  busyId.value = item.id
  busyAction.value = 'delete'
  try {
    await $fetch(`/api/attachments/${item.id}`, { method: 'DELETE' })
    attachments.value = attachments.value.filter((a) => a.id !== item.id)
    notify('File deleted.')
  } catch (err: any) {
    notify(err?.data?.message || 'Delete failed.', 'error')
  } finally {
    busyId.value = null
    busyAction.value = null
  }
}

const fileIcon = (contentType: string) => {
  if (contentType?.startsWith('image/')) return 'mdi-image-outline'
  if (contentType === 'application/pdf') return 'mdi-file-pdf-box'
  if (contentType?.includes('word')) return 'mdi-file-word-outline'
  if (contentType?.includes('sheet') || contentType?.includes('excel')) return 'mdi-file-excel-outline'
  return 'mdi-file-outline'
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.attachments-dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.attachments-dropzone:hover,
.attachments-dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.attachment-card {
  transition: box-shadow 0.15s ease;
}

.attachment-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.attachment-card__icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.min-width-0 {
  min-width: 0;
}
</style>
