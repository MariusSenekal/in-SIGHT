<template>
  <div class="attachments-panel">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-paperclip" size="18" color="primary" />
        <span class="text-subtitle-2 font-weight-bold">Photos &amp; Documents</span>
        <v-chip size="x-small" variant="tonal" color="primary">{{ attachments.length }}</v-chip>
      </div>
      <div v-if="canEdit" class="d-flex align-center ga-2 flex-wrap">
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-image-multiple-outline"
          @click="triggerPhotoPicker"
        >
          Add Photos
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-file-document-multiple-outline"
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
      v-if="canEdit && !pendingFiles.length"
      class="attachments-dropzone mb-4"
      :class="{ 'attachments-dropzone--active': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPhotoPicker"
    >
      <v-icon icon="mdi-tray-arrow-up" size="26" color="primary" class="mb-1" />
      <div class="text-body-2 font-weight-medium">Drag &amp; drop photos or documents here</div>
      <div class="text-caption text-medium-emphasis">or use the buttons above &middot; any number of files</div>
    </div>

    <!-- Staging area: review the selected batch, pick a purpose, then confirm -->
    <v-card v-if="pendingFiles.length" variant="outlined" rounded="lg" class="pending-card mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
          <div class="text-subtitle-2 font-weight-bold">
            {{ pendingFiles.length }} file{{ pendingFiles.length > 1 ? 's' : '' }} ready to upload
          </div>
          <v-select
            v-model="uploadPurpose"
            :items="purposeOptions"
            label="What is this for?"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 220px;"
            :disabled="uploading"
          />
        </div>

        <div
          class="pending-dropzone mb-3"
          :class="{ 'pending-dropzone--active': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <div class="pending-grid">
            <div v-for="(pending, idx) in pendingFiles" :key="pending.key" class="pending-tile">
              <v-img v-if="pending.previewUrl" :src="pending.previewUrl" aspect-ratio="1" cover class="pending-tile__thumb" />
              <div v-else class="pending-tile__thumb pending-tile__thumb--icon">
                <v-icon :icon="fileIcon(pending.file.type)" size="28" color="primary" />
              </div>
              <v-btn
                icon="mdi-close"
                size="x-small"
                color="error"
                variant="flat"
                class="pending-tile__remove"
                :disabled="uploading"
                @click="removePending(idx)"
              />
              <div class="text-caption text-truncate pending-tile__name" :title="pending.file.name">{{ pending.file.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatSize(pending.file.size) }}</div>
            </div>
            <div class="pending-add-tile" @click="triggerPhotoPicker">
              <v-icon icon="mdi-plus" size="24" color="primary" />
            </div>
          </div>
        </div>

        <v-progress-linear v-if="uploading" :model-value="uploadProgress" color="primary" height="8" rounded class="mb-3" />

        <div class="d-flex ga-2 justify-end">
          <v-btn variant="text" :disabled="uploading" @click="clearPending">Cancel</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-cloud-upload-outline" :loading="uploading" @click="confirmUpload">
            Upload {{ pendingFiles.length }} file{{ pendingFiles.length > 1 ? 's' : '' }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate color="primary" size="28" />
    </div>

    <div v-else-if="!attachments.length" class="text-center py-4 text-medium-emphasis text-body-2">
      No photos or documents yet.
    </div>

    <template v-else>
      <div v-if="photoAttachments.length" class="mb-4">
        <div class="text-overline text-medium-emphasis mb-2">Photos</div>
        <div class="photo-grid">
          <div v-for="item in photoAttachments" :key="item.id" class="photo-tile" @click="openAttachment(item)">
            <v-img
              :src="thumbUrls[item.id]"
              aspect-ratio="1"
              cover
              class="photo-tile__img"
            >
              <template #placeholder>
                <div class="d-flex align-center justify-center h-100">
                  <v-progress-circular indeterminate size="20" color="primary" />
                </div>
              </template>
            </v-img>
            <div class="photo-tile__overlay">
              <span class="text-caption text-white text-truncate">{{ item.file_name }}</span>
              <div class="d-flex ga-1">
                <v-btn size="x-small" variant="flat" color="white" icon="mdi-share-variant-outline" :loading="busyId === item.id && busyAction === 'share'" @click.stop="shareAttachment(item)" title="Share" />
                <v-btn v-if="canEdit" size="x-small" variant="flat" color="white" icon="mdi-delete-outline" :loading="busyId === item.id && busyAction === 'delete'" @click.stop="confirmDelete(item)" title="Delete" />
              </div>
            </div>
            <v-chip size="x-small" variant="flat" color="secondary" class="photo-tile__purpose">{{ item.purpose }}</v-chip>
          </div>
        </div>
      </div>

      <div v-if="documentAttachments.length">
        <div class="text-overline text-medium-emphasis mb-2">Documents</div>
        <v-row dense>
          <v-col v-for="item in documentAttachments" :key="item.id" cols="12" sm="6" md="4">
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
      </div>
    </template>

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

interface PendingFile {
  key: string
  file: File
  previewUrl: string | null
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
const uploadProgress = ref(0)
const errorMessage = ref('')
const uploadPurpose = ref('Other')
const isDragging = ref(false)
const photoInputRef = ref<HTMLInputElement | null>(null)
const documentInputRef = ref<HTMLInputElement | null>(null)
const busyId = ref<number | null>(null)
const busyAction = ref<'view' | 'share' | 'delete' | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const deleteDialog = ref<{ show: boolean; target: Attachment | null }>({ show: false, target: null })
const pendingFiles = ref<PendingFile[]>([])
const thumbUrls = ref<Record<number, string>>({})

const photoAttachments = computed(() => attachments.value.filter((a) => a.content_type?.startsWith('image/')))
const documentAttachments = computed(() => attachments.value.filter((a) => !a.content_type?.startsWith('image/')))

const notify = (text: string, color: 'success' | 'error' = 'success') => {
  snackbar.value = { show: true, text, color }
}

const loadThumbnails = async () => {
  const images = photoAttachments.value.filter((a) => !thumbUrls.value[a.id])
  await Promise.all(images.map(async (img) => {
    try {
      const url = await getSignedUrl(img)
      thumbUrls.value = { ...thumbUrls.value, [img.id]: url }
    } catch {
      // Fall back to the placeholder spinner staying put; not fatal.
    }
  }))
}

const loadAttachments = async () => {
  if (!props.recordId) return
  loading.value = true
  errorMessage.value = ''
  try {
    attachments.value = await $fetch<Attachment[]>('/api/attachments', {
      query: { module: props.module, recordId: props.recordId }
    })
    loadThumbnails()
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Failed to load attachments.'
  } finally {
    loading.value = false
  }
}

watch(() => [props.module, props.recordId], loadAttachments, { immediate: true })

const triggerPhotoPicker = () => photoInputRef.value?.click()
const triggerDocumentPicker = () => documentInputRef.value?.click()

const addPendingFiles = (fileList: FileList | File[]) => {
  Array.from(fileList).forEach((file) => {
    pendingFiles.value.push({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    })
  })
}

const removePending = (index: number) => {
  const [removed] = pendingFiles.value.splice(index, 1)
  if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
}

const clearPending = () => {
  pendingFiles.value.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl) })
  pendingFiles.value = []
}

const onFilesSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.length) addPendingFiles(input.files)
  input.value = ''
}

const onDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files?.length) addPendingFiles(e.dataTransfer.files)
}

const uploadWithProgress = (formData: FormData, onProgress: (pct: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/attachments/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        let message = 'Upload failed.'
        try { message = JSON.parse(xhr.responseText)?.message || message } catch { /* ignore */ }
        reject(new Error(message))
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'))
    xhr.send(formData)
  })
}

const confirmUpload = async () => {
  if (!props.recordId || !pendingFiles.value.length) return
  uploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''
  try {
    const formData = new FormData()
    formData.append('module', props.module)
    formData.append('recordId', String(props.recordId))
    formData.append('purpose', uploadPurpose.value)
    pendingFiles.value.forEach((p) => formData.append('files', p.file, p.file.name))

    await uploadWithProgress(formData, (pct) => { uploadProgress.value = pct })
    notify('Files uploaded.')
    clearPending()
    await loadAttachments()
  } catch (err: any) {
    errorMessage.value = err?.message || 'Upload failed.'
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
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

onBeforeUnmount(() => {
  pendingFiles.value.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl) })
})
</script>

<style scoped>
.attachments-dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.attachments-dropzone:hover,
.attachments-dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.pending-card {
  background: rgba(var(--v-theme-primary), 0.03);
}

.pending-dropzone {
  border-radius: 10px;
  transition: background 0.15s ease;
}

.pending-dropzone--active {
  background: rgba(var(--v-theme-primary), 0.08);
}

.pending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 10px;
}

.pending-tile {
  position: relative;
}

.pending-tile__thumb {
  border-radius: 10px;
  overflow: hidden;
  background: rgba(var(--v-theme-primary), 0.08);
}

.pending-tile__thumb--icon {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-tile__remove {
  position: absolute;
  top: -6px;
  right: -6px;
}

.pending-tile__name {
  margin-top: 4px;
}

.pending-add-tile {
  aspect-ratio: 1;
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pending-add-tile:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.photo-tile {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;
  background: rgba(var(--v-theme-primary), 0.06);
}

.photo-tile__img {
  height: 100%;
}

.photo-tile__purpose {
  position: absolute;
  top: 6px;
  left: 6px;
}

.photo-tile__overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: 6px 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78), transparent);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
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
